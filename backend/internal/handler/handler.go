package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"classScore-backend/internal/config"
	"classScore-backend/internal/model"
	"classScore-backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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

// respondOK 返回成功响应
func (h *Handler) respondOK(c *gin.Context, data interface{}, message string) {
	resp := model.APIResponse{Success: true, Data: data}
	if message != "" {
		resp.Message = message
	}
	c.JSON(http.StatusOK, resp)
}

// respondCreated 返回201创建成功响应
func (h *Handler) respondCreated(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, model.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// respondError 返回错误响应
func (h *Handler) respondError(c *gin.Context, status int, message string) {
	c.JSON(status, model.APIResponse{
		Success: false,
		Error:   message,
	})
}

// AuthMiddleware JWT认证中间件
func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := ""
		if auth := c.GetHeader("Authorization"); strings.HasPrefix(auth, "Bearer ") {
			tokenStr = strings.TrimPrefix(auth, "Bearer ")
		}
		if tokenStr == "" {
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			h.respondError(c, http.StatusUnauthorized, "未提供认证Token")
			c.Abort()
			return
		}

		username, err := h.validateToken(tokenStr)
		if err != nil {
			h.respondError(c, http.StatusUnauthorized, "Token无效或已过期")
			c.Abort()
			return
		}

		c.Set("username", username)
		c.Next()
	}
}

// generateToken 生成JWT Token
func (h *Handler) generateToken(username string) (string, error) {
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * time.Duration(h.config.JWT.ExpireHours)).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.config.JWT.Secret))
}

// validateToken 验证JWT Token
func (h *Handler) validateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("无效的签名方法")
		}
		return []byte(h.config.JWT.Secret), nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		username, ok := claims["username"].(string)
		if !ok {
			return "", errors.New("无效的Token")
		}
		return username, nil
	}

	return "", errors.New("无效的Token")
}
