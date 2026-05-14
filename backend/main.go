package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"classScore-backend/internal/auth"
	"classScore-backend/internal/config"
	"classScore-backend/internal/handler"
	"classScore-backend/internal/store"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const adminTokenFile = "admin.token"

// otpTTL 一次性密码有效期
const otpTTL = 30 * time.Minute

func main() {
	execPath, err := os.Executable()
	if err != nil {
		log.Fatal("获取程序路径失败:", err)
	}
	execDir := filepath.Dir(execPath)

	if err := os.Chdir(execDir); err != nil {
		log.Printf("切换工作目录失败: %v, 使用当前目录", err)
	}

	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatal("加载配置失败:", err)
	}

	if err := cfg.EnsureDataDirs(); err != nil {
		log.Fatal("创建数据目录失败:", err)
	}

	if len(os.Args) > 1 {
		runCLI(cfg, os.Args[1:])
		return
	}

	runServer(cfg)
}

func runServer(cfg *config.Config) {
	sqliteStore, err := store.NewSQLiteStore(cfg.GetDBPath())
	if err != nil {
		log.Fatal("初始化数据库失败:", err)
	}
	defer sqliteStore.Close()

	tokenPath := filepath.Join(cfg.Storage.DataDir, adminTokenFile)
	adminToken, err := auth.EnsureAdminToken(tokenPath)
	if err != nil {
		log.Fatal("初始化admin token失败:", err)
	}

	otpMgr := auth.NewOTPManager(otpTTL)
	h := handler.NewHandler(cfg, sqliteStore, otpMgr, adminToken)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if origin == "" || origin == "null" {
				return true
			}
			for _, o := range cfg.Server.AllowedOrigins {
				if o == origin || o == "*" {
					return true
				}
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "X-Admin-Token"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/health", h.Health)
		api.POST("/register", h.Register)
		api.POST("/login", h.Login)

		// 内部接口：仅供本地 CLI 通过 admin token 调用
		internal := api.Group("/_internal")
		internal.Use(h.AdminTokenMiddleware())
		{
			internal.POST("/gen-otp", h.GenerateOTP)
		}

		authorized := api.Group("")
		authorized.Use(h.AuthMiddleware())
		{
			authorized.POST("/change-password", h.ChangePassword)

			// Teacher-only routes
			teacher := authorized.Group("")
			teacher.Use(h.TeacherOnly())
			{
				// Classes
				teacher.GET("/classes", h.ListClasses)
				teacher.POST("/classes", h.CreateClass)
				teacher.PUT("/classes/:id", h.UpdateClass)
				teacher.DELETE("/classes/:id", h.DeleteClass)

				// Students (write)
				teacher.POST("/classes/:id/students", h.CreateStudent)
				teacher.PUT("/students/:id", h.UpdateStudent)
				teacher.DELETE("/students/:id", h.DeleteStudent)
				teacher.POST("/students/:id/reset-password", h.ResetStudentPassword)

				// Groups (write)
				teacher.POST("/classes/:id/groups", h.CreateGroup)
				teacher.PUT("/groups/:id", h.UpdateGroup)
				teacher.DELETE("/groups/:id", h.DeleteGroup)

				// Rules (write)
				teacher.POST("/classes/:id/rules", h.CreateRule)
				teacher.PUT("/rules/:id", h.UpdateRule)
				teacher.DELETE("/rules/:id", h.DeleteRule)

				// Records (write)
				teacher.POST("/classes/:id/records", h.CreateRecord)
				teacher.PUT("/records/:id", h.UpdateRecord)
				teacher.DELETE("/records/:id", h.DeleteRecord)

				// Products (write)
				teacher.POST("/classes/:id/products", h.CreateProduct)
				teacher.PUT("/products/:id", h.UpdateProduct)
				teacher.DELETE("/products/:id", h.DeleteProduct)

				// Exchanges (write)
				teacher.POST("/classes/:id/exchanges", h.CreateExchange)

				// Pets (write)
				teacher.POST("/classes/:id/pet-species", h.CreatePetSpecies)
				teacher.PUT("/pet-species/:id", h.UpdatePetSpecies)
				teacher.DELETE("/pet-species/:id", h.DeletePetSpecies)
				teacher.POST("/classes/:id/student-pets", h.AssignPet)
				teacher.DELETE("/student-pets/:studentId", h.RemoveStudentPet)
				teacher.PUT("/classes/:id/pet-config", h.UpdatePetConfig)

				// Settings (write)
				teacher.PUT("/classes/:id/settings", h.UpdateSettings)

				// Roll call (write)
				teacher.POST("/classes/:id/roll-calls", h.CreateRollCallRecord)

				// Migration
				teacher.GET("/migrate/check", h.CheckLegacyData)
				teacher.POST("/migrate/legacy", h.MigrateFromLegacy)
				teacher.POST("/migrate/import", h.MigrateFromUpload)
			}

			// Read-only routes (both teacher and student)
			authorized.GET("/classes/:id", h.GetClass)
			authorized.GET("/classes/:id/students", h.ListStudents)
			authorized.GET("/classes/:id/groups", h.ListGroups)
			authorized.GET("/classes/:id/rules", h.ListRules)
			authorized.GET("/classes/:id/records", h.ListRecords)
			authorized.GET("/classes/:id/products", h.ListProducts)
			authorized.GET("/classes/:id/exchanges", h.ListExchanges)
			authorized.GET("/classes/:id/pet-species", h.ListPetSpecies)
			authorized.GET("/classes/:id/student-pets", h.ListStudentPets)
			authorized.GET("/classes/:id/pet-config", h.GetPetConfig)
			authorized.GET("/classes/:id/settings", h.GetSettings)
			authorized.GET("/classes/:id/roll-calls", h.ListRollCallRecords)

			// Student-specific
			authorized.GET("/student/profile", h.GetStudentProfile)
		}
	}

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("班级积分系统后端启动成功!")
	log.Printf("服务地址: http://127.0.0.1%s", addr)
	log.Printf("数据目录: %s", cfg.Storage.DataDir)
	log.Printf("Admin token 文件: %s (用于 gen-otp 子命令)", filepath.Join(cfg.Storage.DataDir, adminTokenFile))
	log.Printf("按 Ctrl+C 停止服务")

	if err := r.Run(addr); err != nil {
		log.Fatal("启动服务失败:", err)
	}
}

func runCLI(cfg *config.Config, args []string) {
	switch args[0] {
	case "gen-otp":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "用法: classScore-backend gen-otp <username>")
			os.Exit(2)
		}
		if err := genOTPCLI(cfg, args[1]); err != nil {
			fmt.Fprintf(os.Stderr, "生成OTP失败: %v\n", err)
			os.Exit(1)
		}
	case "help", "-h", "--help":
		printCLIUsage()
	default:
		fmt.Fprintf(os.Stderr, "未知子命令: %s\n", args[0])
		printCLIUsage()
		os.Exit(2)
	}
}

func printCLIUsage() {
	fmt.Println("ClassScore Backend CLI")
	fmt.Println("用法:")
	fmt.Println("  classScore-backend                       # 启动服务")
	fmt.Println("  classScore-backend gen-otp <username>    # 为指定用户生成一次性登录密码")
	fmt.Println("  classScore-backend help                  # 显示帮助")
}

func genOTPCLI(cfg *config.Config, username string) error {
	tokenPath := filepath.Join(cfg.Storage.DataDir, adminTokenFile)
	token, err := auth.ReadAdminToken(tokenPath)
	if err != nil {
		return fmt.Errorf("读取admin token失败 (%s): %w，请确认服务正在运行", tokenPath, err)
	}

	url := fmt.Sprintf("http://127.0.0.1:%d/api/_internal/gen-otp", cfg.Server.Port)
	body, _ := json.Marshal(map[string]string{"username": username})

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Admin-Token", token)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("调用本地服务失败: %w，请确认服务正在运行", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Error   string `json:"error"`
		Data    struct {
			Username  string    `json:"username"`
			Password  string    `json:"password"`
			Role      string    `json:"role"`
			ExpiresAt time.Time `json:"expires_at"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return fmt.Errorf("解析响应失败: %w (raw=%s)", err, string(respBody))
	}
	if !result.Success {
		return fmt.Errorf("%s", result.Error)
	}

	fmt.Println("=== 一次性登录密码 ===")
	fmt.Printf("用户名:   %s\n", result.Data.Username)
	fmt.Printf("角色:     %s\n", result.Data.Role)
	fmt.Printf("密码:     %s\n", result.Data.Password)
	fmt.Printf("过期时间: %s\n", result.Data.ExpiresAt.Local().Format("2006-01-02 15:04:05"))
	fmt.Println("说明:     该密码仅可使用一次，登录成功后立即失效")
	return nil
}
