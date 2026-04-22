package handler

import (
	"net/http"

	"classScore-backend/internal/store"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CheckLegacyData(c *gin.Context) {
	username := c.GetString("username")
	exists := store.LegacyDataExists(h.config.GetUserdataPath(), username)
	h.respondOK(c, gin.H{"has_legacy_data": exists}, "")
}

func (h *Handler) MigrateFromLegacy(c *gin.Context) {
	userID := h.getUserID(c)
	username := c.GetString("username")

	data, err := store.LoadLegacyUserData(h.config.GetUserdataPath(), username)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "读取历史数据失败: "+err.Error())
		return
	}

	if data == nil {
		h.respondError(c, http.StatusNotFound, "未找到历史数据")
		return
	}

	result, err := h.store.MigrateFromJSON(userID, data)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "数据迁移失败: "+err.Error())
		return
	}

	h.respondOK(c, result, "数据迁移成功")
}

func (h *Handler) MigrateFromUpload(c *gin.Context) {
	userID := h.getUserID(c)

	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		h.respondError(c, http.StatusBadRequest, "数据格式错误")
		return
	}

	result, err := h.store.MigrateFromJSON(userID, data)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "数据导入失败: "+err.Error())
		return
	}

	h.respondOK(c, result, "数据导入成功")
}
