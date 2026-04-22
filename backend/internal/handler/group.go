package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListGroups(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	groups, err := h.store.GetGroupsByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取小组列表失败")
		return
	}
	if groups == nil {
		groups = []model.Group{}
	}
	h.respondOK(c, groups, "")
}

func (h *Handler) CreateGroup(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if req.Name == "" {
		h.respondError(c, http.StatusBadRequest, "小组名称不能为空")
		return
	}

	group, err := h.store.CreateGroup(classID, req.Name, req.Color, req.LeaderID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "创建小组失败: "+err.Error())
		return
	}

	h.respondCreated(c, group, "小组创建成功")
}

func (h *Handler) UpdateGroup(c *gin.Context) {
	groupID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的小组ID")
		return
	}

	classID, err := h.store.GetGroupClassID(groupID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "小组不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	group, err := h.store.UpdateGroup(groupID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新小组失败: "+err.Error())
		return
	}

	h.respondOK(c, group, "小组信息已更新")
}

func (h *Handler) DeleteGroup(c *gin.Context) {
	groupID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的小组ID")
		return
	}

	classID, err := h.store.GetGroupClassID(groupID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "小组不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteGroup(groupID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除小组失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "小组已删除")
}
