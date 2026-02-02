package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"classScore-backend/internal/model"
	"classScore-backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
)

// Health 健康检查
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "班级积分系统后端运行正常",
		Data: map[string]interface{}{
			"version": "1.0.0",
			"time":    time.Now().Format(time.RFC3339),
		},
	})
}

// Register 用户注册
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	// 验证输入
	if strings.TrimSpace(req.Username) == "" {
		h.respondError(w, http.StatusBadRequest, "用户名不能为空")
		return
	}
	if len(req.Username) < 2 || len(req.Username) > 20 {
		h.respondError(w, http.StatusBadRequest, "用户名长度需要在2-20个字符之间")
		return
	}
	if len(req.Password) < 4 {
		h.respondError(w, http.StatusBadRequest, "密码长度至少4个字符")
		return
	}

	// 创建用户
	user, err := h.sqliteStore.CreateUser(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, store.ErrUserExists) {
			h.respondError(w, http.StatusConflict, "用户名已存在，请换一个用户名")
			return
		}
		h.respondError(w, http.StatusInternalServerError, "注册失败: "+err.Error())
		return
	}

	// 生成Token
	token, err := h.generateToken(user.Username)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "生成Token失败")
		return
	}

	h.respondJSON(w, http.StatusCreated, model.APIResponse{
		Success: true,
		Message: "注册成功",
		Data: model.LoginResponse{
			Token:    token,
			Username: user.Username,
			Message:  "注册成功",
		},
	})
}

// Login 用户登录
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	// 验证用户
	user, err := h.sqliteStore.ValidateUser(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			h.respondError(w, http.StatusUnauthorized, "用户不存在")
			return
		}
		if errors.Is(err, store.ErrInvalidPass) {
			h.respondError(w, http.StatusUnauthorized, "密码错误")
			return
		}
		h.respondError(w, http.StatusInternalServerError, "登录失败")
		return
	}

	// 生成Token
	token, err := h.generateToken(user.Username)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "生成Token失败")
		return
	}

	// 检查是否有已保存的数据
	hasData := h.fileStore.UserDataExists(user.Username)

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "登录成功",
		Data: map[string]interface{}{
			"token":    token,
			"username": user.Username,
			"has_data": hasData,
		},
	})
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

// getTokenFromRequest 从请求中获取Token
func (h *Handler) getTokenFromRequest(r *http.Request) string {
	// 优先从Authorization头获取
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	// 也支持从查询参数获取
	return r.URL.Query().Get("token")
}

// respondJSON 返回JSON响应
func (h *Handler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError 返回错误响应
func (h *Handler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, model.APIResponse{
		Success: false,
		Error:   message,
	})
}
