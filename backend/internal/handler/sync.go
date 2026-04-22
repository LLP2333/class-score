package handler

import (
	"errors"
	"net/http"
	"time"

	"classScore-backend/internal/store"

	"github.com/gin-gonic/gin"
)

// SyncMeta 获取用户同步元数据（版本号和最后修改时间）
func (h *Handler) SyncMeta(c *gin.Context) {
	username := c.GetString("username")

	meta, err := h.fileStore.LoadSyncMeta(username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "读取同步信息失败")
		return
	}

	h.respondOK(c, gin.H{
		"version":          meta.Version,
		"last_modified_at": meta.LastModifiedAt,
	}, "")
}

// SyncUpload 上传数据到后端
func (h *Handler) SyncUpload(c *gin.Context) {
	username := c.GetString("username")

	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		h.respondError(c, http.StatusBadRequest, "数据格式错误")
		return
	}

	data["syncedAt"] = time.Now().Format(time.RFC3339)
	data["syncedBy"] = username

	if err := h.fileStore.SaveUserData(username, data); err != nil {
		h.respondError(c, http.StatusInternalServerError, "保存数据失败: "+err.Error())
		return
	}

	meta, err := h.fileStore.IncrementSyncVersion(username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新版本信息失败: "+err.Error())
		return
	}

	h.respondOK(c, gin.H{
		"version":          meta.Version,
		"last_modified_at": meta.LastModifiedAt,
	}, "数据上传成功")
}

// SyncDownload 从后端下载数据
func (h *Handler) SyncDownload(c *gin.Context) {
	username := c.GetString("username")

	data, err := h.fileStore.LoadUserData(username)
	if err != nil {
		if errors.Is(err, store.ErrDataNotFound) {
			h.respondOK(c, nil, "暂无同步数据")
			return
		}
		h.respondError(c, http.StatusInternalServerError, "读取数据失败: "+err.Error())
		return
	}

	h.respondOK(c, data, "数据下载成功")
}
