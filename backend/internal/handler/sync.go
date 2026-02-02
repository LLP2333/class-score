package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"classScore-backend/internal/model"
	"classScore-backend/internal/store"
)

// SyncUpload 上传数据到后端
func (h *Handler) SyncUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

	// 验证Token
	token := h.getTokenFromRequest(r)
	if token == "" {
		h.respondError(w, http.StatusUnauthorized, "未提供认证Token")
		return
	}

	username, err := h.validateToken(token)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "Token无效或已过期")
		return
	}

	// 解析请求体
	var data map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.respondError(w, http.StatusBadRequest, "数据格式错误")
		return
	}

	// 添加同步时间戳
	data["syncedAt"] = time.Now().Format(time.RFC3339)
	data["syncedBy"] = username

	// 保存数据到文件
	if err := h.fileStore.SaveUserData(username, data); err != nil {
		h.respondError(w, http.StatusInternalServerError, "保存数据失败: "+err.Error())
		return
	}

	// 获取文件信息
	info, _ := h.fileStore.GetUserDataInfo(username)

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "数据上传成功",
		Data: map[string]interface{}{
			"synced_at": data["syncedAt"],
			"file_info": info,
		},
	})
}

// SyncDownload 从后端下载数据
func (h *Handler) SyncDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

	// 验证Token
	token := h.getTokenFromRequest(r)
	if token == "" {
		h.respondError(w, http.StatusUnauthorized, "未提供认证Token")
		return
	}

	username, err := h.validateToken(token)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "Token无效或已过期")
		return
	}

	// 读取用户数据
	data, err := h.fileStore.LoadUserData(username)
	if err != nil {
		if errors.Is(err, store.ErrDataNotFound) {
			h.respondJSON(w, http.StatusOK, model.APIResponse{
				Success: true,
				Message: "暂无同步数据",
				Data:    nil,
			})
			return
		}
		h.respondError(w, http.StatusInternalServerError, "读取数据失败: "+err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "数据下载成功",
		Data:    data,
	})
}
