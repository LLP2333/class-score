package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"classScore-backend/internal/model"
	"classScore-backend/internal/store"
)

// SyncMeta 获取用户同步元数据（版本号和最后修改时间）
func (h *Handler) SyncMeta(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

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

	meta, err := h.fileStore.LoadSyncMeta(username)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "读取同步信息失败")
		return
	}

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"version":          meta.Version,
			"last_modified_at": meta.LastModifiedAt,
		},
	})
}

// SyncUpload 上传数据到后端
func (h *Handler) SyncUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
		return
	}

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

	var data map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.respondError(w, http.StatusBadRequest, "数据格式错误")
		return
	}

	data["syncedAt"] = time.Now().Format(time.RFC3339)
	data["syncedBy"] = username

	if err := h.fileStore.SaveUserData(username, data); err != nil {
		h.respondError(w, http.StatusInternalServerError, "保存数据失败: "+err.Error())
		return
	}

	// 递增版本号
	meta, err := h.fileStore.IncrementSyncVersion(username)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "更新版本信息失败: "+err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "数据上传成功",
		Data: map[string]interface{}{
			"version":          meta.Version,
			"last_modified_at": meta.LastModifiedAt,
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
