package handler

import (
	"classScore-backend/internal/config"
	"classScore-backend/internal/store"
)

// Handler HTTP处理器
type Handler struct {
	config      *config.Config
	sqliteStore *store.SQLiteStore
	fileStore   *store.FileStore
}

// NewHandler 创建处理器实例
func NewHandler(cfg *config.Config, sqlite *store.SQLiteStore, file *store.FileStore) *Handler {
	return &Handler{
		config:      cfg,
		sqliteStore: sqlite,
		fileStore:   file,
	}
}
