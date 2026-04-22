package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"classScore-backend/internal/model"
	"classScore-backend/internal/store"

	"github.com/gin-gonic/gin"
)

// Health 健康检查
func (h *Handler) Health(c *gin.Context) {
	h.respondOK(c, gin.H{
		"version": "1.0.0",
		"time":    time.Now().Format(time.RFC3339),
	}, "班级积分系统后端运行正常")
}

// Register 用户注册
func (h *Handler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if strings.TrimSpace(req.Username) == "" {
		h.respondError(c, http.StatusBadRequest, "用户名不能为空")
		return
	}
	if len(req.Username) < 2 || len(req.Username) > 20 {
		h.respondError(c, http.StatusBadRequest, "用户名长度需要在2-20个字符之间")
		return
	}
	if len(req.Password) < 4 {
		h.respondError(c, http.StatusBadRequest, "密码长度至少4个字符")
		return
	}

	user, err := h.sqliteStore.CreateUser(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, store.ErrUserExists) {
			h.respondError(c, http.StatusConflict, "用户名已存在，请换一个用户名")
			return
		}
		h.respondError(c, http.StatusInternalServerError, "注册失败: "+err.Error())
		return
	}

	token, err := h.generateToken(user.Username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "生成Token失败")
		return
	}

	h.respondCreated(c, model.LoginResponse{
		Token:    token,
		Username: user.Username,
		Message:  "注册成功",
	}, "注册成功")
}

// Login 用户登录
func (h *Handler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	user, err := h.sqliteStore.ValidateUser(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			h.respondError(c, http.StatusUnauthorized, "用户不存在")
			return
		}
		if errors.Is(err, store.ErrInvalidPass) {
			h.respondError(c, http.StatusUnauthorized, "密码错误")
			return
		}
		h.respondError(c, http.StatusInternalServerError, "登录失败")
		return
	}

	token, err := h.generateToken(user.Username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "生成Token失败")
		return
	}

	hasData := h.fileStore.UserDataExists(user.Username)

	h.respondOK(c, gin.H{
		"token":    token,
		"username": user.Username,
		"has_data": hasData,
	}, "登录成功")
}

// ChangePassword 修改密码
func (h *Handler) ChangePassword(c *gin.Context) {
	username := c.GetString("username")

	var req model.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if _, err := h.sqliteStore.ValidateUser(username, req.OldPassword); err != nil {
		if errors.Is(err, store.ErrInvalidPass) {
			h.respondError(c, http.StatusUnauthorized, "当前密码错误")
			return
		}
		h.respondError(c, http.StatusInternalServerError, "验证失败")
		return
	}

	if len(req.NewPassword) < 4 {
		h.respondError(c, http.StatusBadRequest, "新密码长度至少4个字符")
		return
	}

	if err := h.sqliteStore.UpdateUserPassword(username, req.NewPassword); err != nil {
		h.respondError(c, http.StatusInternalServerError, "修改密码失败")
		return
	}

	h.respondOK(c, nil, "密码修改成功")
}
