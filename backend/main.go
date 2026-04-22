package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"classScore-backend/internal/config"
	"classScore-backend/internal/handler"
	"classScore-backend/internal/store"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

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

	sqliteStore, err := store.NewSQLiteStore(cfg.GetDBPath())
	if err != nil {
		log.Fatal("初始化数据库失败:", err)
	}
	defer sqliteStore.Close()

	h := handler.NewHandler(cfg, sqliteStore)

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
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/health", h.Health)
		api.POST("/register", h.Register)
		api.POST("/login", h.Login)

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
	log.Printf("按 Ctrl+C 停止服务")

	if err := r.Run(addr); err != nil {
		log.Fatal("启动服务失败:", err)
	}
}
