package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListStudents(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}

	if !h.checkClassAccess(c, classID) {
		return
	}

	students, err := h.store.GetStudentsByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取学生列表失败")
		return
	}
	if students == nil {
		students = []model.Student{}
	}
	h.respondOK(c, students, "")
}

func (h *Handler) CreateStudent(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}

	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if req.Name == "" {
		h.respondError(c, http.StatusBadRequest, "学生姓名不能为空")
		return
	}

	exists, err := h.store.StudentExistsInClass(classID, req.Name)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "校验失败: "+err.Error())
		return
	}
	if exists {
		h.respondError(c, http.StatusConflict, "该班级已存在同名学生「"+req.Name+"」")
		return
	}

	if req.Avatar <= 0 {
		req.Avatar = 1
	}

	student, err := h.store.CreateStudent(classID, req.Name, req.Avatar, req.GroupID, req.Password)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "添加学生失败: "+err.Error())
		return
	}

	h.respondCreated(c, student, "学生添加成功")
}

func (h *Handler) UpdateStudent(c *gin.Context) {
	studentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的学生ID")
		return
	}

	classID, err := h.store.GetStudentClassID(studentID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "学生不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	student, err := h.store.UpdateStudent(studentID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新学生失败: "+err.Error())
		return
	}

	h.respondOK(c, student, "学生信息已更新")
}

func (h *Handler) DeleteStudent(c *gin.Context) {
	studentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的学生ID")
		return
	}

	classID, err := h.store.GetStudentClassID(studentID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "学生不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteStudent(studentID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除学生失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "学生已删除")
}

func (h *Handler) ResetStudentPassword(c *gin.Context) {
	studentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的学生ID")
		return
	}

	classID, err := h.store.GetStudentClassID(studentID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "学生不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	if req.NewPassword == "" {
		req.NewPassword = "123456"
	}

	if err := h.store.ResetStudentPassword(studentID, req.NewPassword); err != nil {
		h.respondError(c, http.StatusInternalServerError, "重置密码失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "密码已重置")
}

func (h *Handler) GetStudentProfile(c *gin.Context) {
	userID := h.getUserID(c)

	st, err := h.store.GetStudentByUserID(userID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "学生信息不存在")
		return
	}

	cls, err := h.store.GetClassByID(st.ClassID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取班级信息失败")
		return
	}

	h.respondOK(c, gin.H{
		"student": st,
		"class":   cls,
	}, "")
}
