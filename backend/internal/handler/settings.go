package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetSettings(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	settings, err := h.store.GetClassSettings(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取设置失败")
		return
	}

	h.respondOK(c, settings, "")
}

func (h *Handler) UpdateSettings(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	settings, err := h.store.UpdateClassSettings(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新设置失败: "+err.Error())
		return
	}

	h.respondOK(c, settings, "设置已更新")
}

func (h *Handler) ListRollCallRecords(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	records, err := h.store.GetRollCallRecordsByClass(classID, 50)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取点名记录失败")
		return
	}
	if records == nil {
		records = []model.RollCallRecord{}
	}
	h.respondOK(c, records, "")
}

func (h *Handler) CreateRollCallRecord(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateRollCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	record, err := h.store.CreateRollCallRecord(classID, req.StudentNames)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "保存点名记录失败: "+err.Error())
		return
	}

	h.respondCreated(c, record, "点名记录已保存")
}
