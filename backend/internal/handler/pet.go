package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListPetSpecies(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	species, err := h.store.GetPetSpeciesByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取宠物种类失败")
		return
	}
	if species == nil {
		species = []model.PetSpecies{}
	}
	h.respondOK(c, species, "")
}

func (h *Handler) CreatePetSpecies(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreatePetSpeciesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	species, err := h.store.CreatePetSpecies(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "创建宠物种类失败: "+err.Error())
		return
	}

	h.respondCreated(c, species, "宠物种类创建成功")
}

func (h *Handler) UpdatePetSpecies(c *gin.Context) {
	speciesID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的宠物种类ID")
		return
	}

	classID, err := h.store.GetPetSpeciesClassID(speciesID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "宠物种类不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdatePetSpeciesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	species, err := h.store.UpdatePetSpecies(speciesID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新宠物种类失败: "+err.Error())
		return
	}

	h.respondOK(c, species, "宠物种类已更新")
}

func (h *Handler) DeletePetSpecies(c *gin.Context) {
	speciesID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的宠物种类ID")
		return
	}

	classID, err := h.store.GetPetSpeciesClassID(speciesID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "宠物种类不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeletePetSpecies(speciesID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除宠物种类失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "宠物种类已删除")
}

func (h *Handler) ListStudentPets(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	pets, err := h.store.GetStudentPetsByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取学生宠物失败")
		return
	}
	if pets == nil {
		pets = []model.StudentPet{}
	}
	h.respondOK(c, pets, "")
}

func (h *Handler) AssignPet(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.AssignPetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	pet, err := h.store.AssignPet(req.StudentID, req.SpeciesID, req.Nickname)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "分配宠物失败: "+err.Error())
		return
	}

	h.respondOK(c, pet, "宠物分配成功")
}

func (h *Handler) RemoveStudentPet(c *gin.Context) {
	studentID, err := strconv.ParseInt(c.Param("studentId"), 10, 64)
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

	if err := h.store.RemoveStudentPet(studentID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "移除宠物失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "宠物已移除")
}

func (h *Handler) GetPetConfig(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	config, err := h.store.GetPetConfig(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取宠物配置失败")
		return
	}

	h.respondOK(c, config, "")
}

func (h *Handler) UpdatePetConfig(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdatePetConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	config, err := h.store.UpdatePetConfig(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新宠物配置失败: "+err.Error())
		return
	}

	h.respondOK(c, config, "宠物配置已更新")
}
