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

type Handler struct {
	config *config.Config
	store  *store.SQLiteStore
}

func NewHandler(cfg *config.Config, s *store.SQLiteStore) *Handler {
	return &Handler{
		config: cfg,
		store:  s,
	}
}

func (h *Handler) respondOK(c *gin.Context, data interface{}, message string) {
	resp := model.APIResponse{Success: true, Data: data}
	if message != "" {
		resp.Message = message
	}
	c.JSON(http.StatusOK, resp)
}

func (h *Handler) respondCreated(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, model.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func (h *Handler) respondError(c *gin.Context, status int, message string) {
	c.JSON(status, model.APIResponse{
		Success: false,
		Error:   message,
	})
}

func (h *Handler) generateToken(userID int64, username, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"role":     role,
		"exp":      time.Now().Add(time.Hour * time.Duration(h.config.JWT.ExpireHours)).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.config.JWT.Secret))
}

type tokenClaims struct {
	UserID   int64
	Username string
	Role     string
}

func (h *Handler) validateToken(tokenString string) (*tokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("无效的签名方法")
		}
		return []byte(h.config.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		username, _ := claims["username"].(string)
		role, _ := claims["role"].(string)
		var userID int64
		if uid, ok := claims["user_id"].(float64); ok {
			userID = int64(uid)
		}
		if username == "" {
			return nil, errors.New("无效的Token")
		}
		return &tokenClaims{UserID: userID, Username: username, Role: role}, nil
	}

	return nil, errors.New("无效的Token")
}

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

		claims, err := h.validateToken(tokenStr)
		if err != nil {
			h.respondError(c, http.StatusUnauthorized, "Token无效或已过期")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func (h *Handler) TeacherOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "teacher" {
			h.respondError(c, http.StatusForbidden, "仅教师可执行此操作")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *Handler) getUserID(c *gin.Context) int64 {
	id, _ := c.Get("user_id")
	if uid, ok := id.(int64); ok {
		return uid
	}
	return 0
}

func (h *Handler) checkClassAccess(c *gin.Context, classID int64) bool {
	role := c.GetString("role")
	userID := h.getUserID(c)

	if role == "teacher" {
		owner, err := h.store.IsClassOwner(classID, userID)
		if err != nil || !owner {
			h.respondError(c, http.StatusForbidden, "无权访问此班级")
			return false
		}
		return true
	}

	if role == "student" {
		st, err := h.store.GetStudentByUserID(userID)
		if err != nil || st.ClassID != classID {
			h.respondError(c, http.StatusForbidden, "无权访问此班级")
			return false
		}
		return true
	}

	h.respondError(c, http.StatusForbidden, "无权限")
	return false
}
