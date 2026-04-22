package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListClasses(c *gin.Context) {
	userID := h.getUserID(c)
	classes, err := h.store.GetClassesByTeacher(userID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取班级列表失败")
		return
	}
	if classes == nil {
		classes = []model.Class{}
	}
	h.respondOK(c, classes, "")
}

func (h *Handler) CreateClass(c *gin.Context) {
	userID := h.getUserID(c)

	var req model.CreateClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if req.Name == "" {
		h.respondError(c, http.StatusBadRequest, "班级名称不能为空")
		return
	}

	cls, err := h.store.CreateClass(req.Name, req.TeacherName, userID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "创建班级失败: "+err.Error())
		return
	}

	h.respondCreated(c, cls, "班级创建成功")
}

func (h *Handler) UpdateClass(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}

	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	cls, err := h.store.UpdateClass(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新班级失败: "+err.Error())
		return
	}

	h.respondOK(c, cls, "班级信息已更新")
}

func (h *Handler) DeleteClass(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}

	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteClass(classID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除班级失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "班级已删除")
}

func (h *Handler) GetClass(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}

	if !h.checkClassAccess(c, classID) {
		return
	}

	cls, err := h.store.GetClassByID(classID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "班级不存在")
		return
	}

	h.respondOK(c, cls, "")
}
