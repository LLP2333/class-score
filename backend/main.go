package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"classScore-backend/internal/config"
	"classScore-backend/internal/handler"
	"classScore-backend/internal/store"
)

func main() {
	// 获取可执行文件所在目录
	execPath, err := os.Executable()
	if err != nil {
		log.Fatal("获取程序路径失败:", err)
	}
	execDir := filepath.Dir(execPath)

	// 切换工作目录到可执行文件所在目录（便于U盘部署）
	if err := os.Chdir(execDir); err != nil {
		log.Printf("切换工作目录失败: %v, 使用当前目录", err)
	}

	// 加载配置
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatal("加载配置失败:", err)
	}

	// 确保数据目录存在
	if err := cfg.EnsureDataDirs(); err != nil {
		log.Fatal("创建数据目录失败:", err)
	}

	// 初始化SQLite存储
	sqliteStore, err := store.NewSQLiteStore(cfg.GetDBPath())
	if err != nil {
		log.Fatal("初始化数据库失败:", err)
	}
	defer sqliteStore.Close()

	// 初始化文件存储
	fileStore := store.NewFileStore(cfg.GetUserdataPath())

	// 创建HTTP处理器
	h := handler.NewHandler(cfg, sqliteStore, fileStore)

	// 设置路由
	mux := http.NewServeMux()

	// API路由
	mux.HandleFunc("/api/health", h.Health)
	mux.HandleFunc("/api/register", h.Register)
	mux.HandleFunc("/api/login", h.Login)
	mux.HandleFunc("/api/sync/meta", h.SyncMeta)
	mux.HandleFunc("/api/sync/upload", h.SyncUpload)
	mux.HandleFunc("/api/sync/download", h.SyncDownload)

	// 添加CORS中间件
	handler := corsMiddleware(mux, cfg.Server.AllowedOrigins)

	// 启动服务
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("班级积分系统后端启动成功!")
	log.Printf("服务地址: http://127.0.0.1%s", addr)
	log.Printf("数据目录: %s", cfg.Storage.DataDir)
	log.Printf("按 Ctrl+C 停止服务")

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal("启动服务失败:", err)
	}
}

// corsMiddleware CORS中间件
func corsMiddleware(next http.Handler, allowedOrigins []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// 检查是否允许该来源
		allowed := false
		for _, o := range allowedOrigins {
			if o == origin || o == "*" {
				allowed = true
				break
			}
		}

		// 对于file://协议的请求，Origin可能为null
		if origin == "" || origin == "null" {
			allowed = true
		}

		if allowed {
			if origin != "" && origin != "null" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// 处理预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
