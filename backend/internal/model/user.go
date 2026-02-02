package model

import "time"

// User 用户模型
type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // 不序列化到JSON
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Message  string `json:"message"`
}

// SyncData 同步数据结构
type SyncData struct {
	Version         string      `json:"version"`
	ExportedAt      string      `json:"exportedAt"`
	ClassInfo       interface{} `json:"classInfo"`
	Students        interface{} `json:"students"`
	Groups          interface{} `json:"groups"`
	Rules           interface{} `json:"rules"`
	Products        interface{} `json:"products"`
	ScoreRecords    interface{} `json:"scoreRecords"`
	Exchanges       interface{} `json:"exchanges"`
	RollCallHistory interface{} `json:"rollCallHistory"`
	LotteryHistory  interface{} `json:"lotteryHistory"`
	Settings        interface{} `json:"settings"`
}

// APIResponse 通用API响应
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
