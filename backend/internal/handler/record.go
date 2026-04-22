package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListRecords(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	limit := 500
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}

	records, err := h.store.GetRecordsByClass(classID, limit)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取积分记录失败")
		return
	}
	if records == nil {
		records = []model.ScoreRecord{}
	}
	h.respondOK(c, records, "")
}

func (h *Handler) CreateRecord(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	// Verify student belongs to this class
	studentClassID, err := h.store.GetStudentClassID(req.StudentID)
	if err != nil || studentClassID != classID {
		h.respondError(c, http.StatusBadRequest, "学生不属于此班级")
		return
	}

	record, err := h.store.CreateRecord(req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "添加积分记录失败: "+err.Error())
		return
	}

	h.respondCreated(c, record, "积分记录已添加")
}

func (h *Handler) UpdateRecord(c *gin.Context) {
	recordID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的记录ID")
		return
	}

	classID, err := h.store.GetRecordClassID(recordID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "记录不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	record, err := h.store.UpdateRecord(recordID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新记录失败: "+err.Error())
		return
	}

	h.respondOK(c, record, "记录已更新")
}

func (h *Handler) DeleteRecord(c *gin.Context) {
	recordID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的记录ID")
		return
	}

	classID, err := h.store.GetRecordClassID(recordID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "记录不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteRecord(recordID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除记录失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "记录已删除")
}
