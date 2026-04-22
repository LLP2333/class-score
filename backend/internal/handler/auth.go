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

func (h *Handler) Health(c *gin.Context) {
	h.respondOK(c, gin.H{
		"version": "2.0.0",
		"time":    time.Now().Format(time.RFC3339),
	}, "班级积分系统后端运行正常")
}

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

	user, err := h.store.CreateUser(req.Username, req.Password, "teacher")
	if err != nil {
		if errors.Is(err, store.ErrUserExists) {
			h.respondError(c, http.StatusConflict, "用户名已存在，请换一个用户名")
			return
		}
		h.respondError(c, http.StatusInternalServerError, "注册失败: "+err.Error())
		return
	}

	token, err := h.generateToken(user.ID, user.Username, user.Role)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "生成Token失败")
		return
	}

	h.respondCreated(c, model.LoginResponse{
		Token:    token,
		Username: user.Username,
		Role:     user.Role,
		Message:  "注册成功",
	}, "注册成功")
}

func (h *Handler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	user, err := h.store.ValidateUser(req.Username, req.Password)
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

	token, err := h.generateToken(user.ID, user.Username, user.Role)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "生成Token失败")
		return
	}

	resp := gin.H{
		"token":    token,
		"username": user.Username,
		"role":     user.Role,
	}

	if user.Role == "teacher" {
		hasLegacy := store.LegacyDataExists(h.config.GetUserdataPath(), user.Username)
		resp["has_legacy_data"] = hasLegacy

		classes, _ := h.store.GetClassesByTeacher(user.ID)
		resp["classes"] = classes
	}

	if user.Role == "student" {
		st, err := h.store.GetStudentByUserID(user.ID)
		if err == nil {
			resp["class_id"] = st.ClassID
			resp["student_id"] = st.ID
		}
	}

	h.respondOK(c, resp, "登录成功")
}

func (h *Handler) ChangePassword(c *gin.Context) {
	userID := h.getUserID(c)

	var req model.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	user, err := h.store.GetUserByID(userID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "用户不存在")
		return
	}

	if !store.CheckPassword(req.OldPassword, user.PasswordHash) {
		h.respondError(c, http.StatusUnauthorized, "当前密码错误")
		return
	}

	if len(req.NewPassword) < 4 {
		h.respondError(c, http.StatusBadRequest, "新密码长度至少4个字符")
		return
	}

	if err := h.store.UpdateUserPassword(userID, req.NewPassword); err != nil {
		h.respondError(c, http.StatusInternalServerError, "修改密码失败")
		return
	}

	h.respondOK(c, nil, "密码修改成功")
}
