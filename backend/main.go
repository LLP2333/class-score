package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

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

	fileStore := store.NewFileStore(cfg.GetUserdataPath())

	h := handler.NewHandler(cfg, sqliteStore, fileStore)

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
		AllowCredentials: true,
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
			authorized.GET("/sync/meta", h.SyncMeta)
			authorized.POST("/sync/upload", h.SyncUpload)
			authorized.GET("/sync/download", h.SyncDownload)
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
