package handler

import (
	"math/rand"
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

func (h *Handler) CreateRandomRollCall(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateRandomRollCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}
	if req.Count <= 0 {
		h.respondError(c, http.StatusBadRequest, "点名人数必须大于0")
		return
	}
	if req.ExcludeRecentCount < 0 {
		h.respondError(c, http.StatusBadRequest, "排除次数不能小于0")
		return
	}

	students, err := h.store.GetStudentsByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取学生列表失败")
		return
	}
	if len(students) == 0 {
		h.respondError(c, http.StatusBadRequest, "没有学生可以点名")
		return
	}
	if req.Count > len(students) {
		h.respondError(c, http.StatusBadRequest, "点名人数不能超过学生总数")
		return
	}

	excluded := map[string]bool{}
	if req.ExcludeRecentCount > 0 {
		records, err := h.store.GetRollCallRecordsByClass(classID, req.ExcludeRecentCount)
		if err != nil {
			h.respondError(c, http.StatusInternalServerError, "获取点名记录失败")
			return
		}
		for _, record := range records {
			for _, name := range record.StudentNames {
				excluded[name] = true
			}
		}
	}

	candidates := make([]model.Student, 0, len(students))
	for _, student := range students {
		if !excluded[student.Name] {
			candidates = append(candidates, student)
		}
	}
	if len(candidates) < req.Count {
		h.respondError(c, http.StatusBadRequest, "可点名学生不足，请减少排除次数或点名人数")
		return
	}

	rand.Shuffle(len(candidates), func(i, j int) {
		candidates[i], candidates[j] = candidates[j], candidates[i]
	})

	selectedNames := make([]string, 0, req.Count)
	for _, student := range candidates[:req.Count] {
		selectedNames = append(selectedNames, student.Name)
	}

	record, err := h.store.CreateRollCallRecord(classID, selectedNames)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "保存点名记录失败: "+err.Error())
		return
	}

	h.respondCreated(c, record, "点名完成")
}
