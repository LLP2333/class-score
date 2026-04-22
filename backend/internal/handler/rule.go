package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListRules(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	rules, err := h.store.GetRulesByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取规则列表失败")
		return
	}
	if rules == nil {
		rules = []model.Rule{}
	}
	h.respondOK(c, rules, "")
}

func (h *Handler) CreateRule(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if req.Name == "" {
		h.respondError(c, http.StatusBadRequest, "规则名称不能为空")
		return
	}

	rule, err := h.store.CreateRule(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "创建规则失败: "+err.Error())
		return
	}

	h.respondCreated(c, rule, "规则创建成功")
}

func (h *Handler) UpdateRule(c *gin.Context) {
	ruleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的规则ID")
		return
	}

	classID, err := h.store.GetRuleClassID(ruleID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "规则不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	rule, err := h.store.UpdateRule(ruleID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新规则失败: "+err.Error())
		return
	}

	h.respondOK(c, rule, "规则已更新")
}

func (h *Handler) DeleteRule(c *gin.Context) {
	ruleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的规则ID")
		return
	}

	classID, err := h.store.GetRuleClassID(ruleID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "规则不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteRule(ruleID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除规则失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "规则已删除")
}
