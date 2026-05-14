package handler

import (
	"log"
	"net/http"
	"strings"

	"classScore-backend/internal/auth"

	"github.com/gin-gonic/gin"
)

// AdminTokenMiddleware 仅允许携带正确 X-Admin-Token 的请求通过
// 该 token 在后端启动时随机生成并写入 data 目录的本地文件，仅容器内可读
func (h *Handler) AdminTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if h.adminToken == "" {
			h.respondError(c, http.StatusServiceUnavailable, "Admin token 未配置")
			c.Abort()
			return
		}
		token := strings.TrimSpace(c.GetHeader("X-Admin-Token"))
		if !auth.CompareTokens(token, h.adminToken) {
			h.respondError(c, http.StatusUnauthorized, "Admin token 无效")
			c.Abort()
			return
		}
		c.Next()
	}
}

type genOTPRequest struct {
	Username string `json:"username"`
}

// GenerateOTP 为指定用户名生成一次性密码（仅存内存），用于运维排查
func (h *Handler) GenerateOTP(c *gin.Context) {
	var req genOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}
	username := strings.TrimSpace(req.Username)
	if username == "" {
		h.respondError(c, http.StatusBadRequest, "用户名不能为空")
		return
	}

	user, err := h.store.GetUserByUsername(username)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "用户不存在")
		return
	}

	entry, err := h.otp.Generate(user.Username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "生成OTP失败: "+err.Error())
		return
	}

	log.Printf("[OTP] 已为用户 %s (role=%s) 生成一次性密码，将于 %s 过期",
		user.Username, user.Role, entry.ExpiresAt.Format("2006-01-02 15:04:05"))

	h.respondOK(c, gin.H{
		"username":   entry.Username,
		"password":   entry.Password,
		"expires_at": entry.ExpiresAt,
		"role":       user.Role,
	}, "一次性密码生成成功，仅可使用一次")
}
