package handler

import (
	"net/http"
	"strconv"

	"classScore-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListProducts(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	products, err := h.store.GetProductsByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取商品列表失败")
		return
	}
	if products == nil {
		products = []model.Product{}
	}
	h.respondOK(c, products, "")
}

func (h *Handler) CreateProduct(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	product, err := h.store.CreateProduct(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "创建商品失败: "+err.Error())
		return
	}

	h.respondCreated(c, product, "商品创建成功")
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的商品ID")
		return
	}

	classID, err := h.store.GetProductClassID(productID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "商品不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	product, err := h.store.UpdateProduct(productID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "更新商品失败: "+err.Error())
		return
	}

	h.respondOK(c, product, "商品已更新")
}

func (h *Handler) DeleteProduct(c *gin.Context) {
	productID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的商品ID")
		return
	}

	classID, err := h.store.GetProductClassID(productID)
	if err != nil {
		h.respondError(c, http.StatusNotFound, "商品不存在")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	if err := h.store.DeleteProduct(productID); err != nil {
		h.respondError(c, http.StatusInternalServerError, "删除商品失败: "+err.Error())
		return
	}

	h.respondOK(c, nil, "商品已删除")
}

func (h *Handler) ListExchanges(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	exchanges, err := h.store.GetExchangesByClass(classID)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "获取兑换记录失败")
		return
	}
	if exchanges == nil {
		exchanges = []model.Exchange{}
	}
	h.respondOK(c, exchanges, "")
}

func (h *Handler) CreateExchange(c *gin.Context) {
	classID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		h.respondError(c, http.StatusBadRequest, "无效的班级ID")
		return
	}
	if !h.checkClassAccess(c, classID) {
		return
	}

	var req model.CreateExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondError(c, http.StatusBadRequest, "请求格式错误")
		return
	}

	exchange, err := h.store.CreateExchange(classID, req)
	if err != nil {
		h.respondError(c, http.StatusInternalServerError, "兑换失败: "+err.Error())
		return
	}

	h.respondCreated(c, exchange, "兑换成功")
}
