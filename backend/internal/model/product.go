package model

import "time"

type Product struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	Price         int    `json:"price"`
	Stock         int    `json:"stock"`
	Icon          string `json:"icon"`
	ExchangeCount int    `json:"exchange_count"`
	ClassID       int64  `json:"class_id"`
}

type CreateProductRequest struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
	Stock int    `json:"stock"`
	Icon  string `json:"icon"`
}

type UpdateProductRequest struct {
	Name  *string `json:"name,omitempty"`
	Price *int    `json:"price,omitempty"`
	Stock *int    `json:"stock,omitempty"`
	Icon  *string `json:"icon,omitempty"`
}

type Exchange struct {
	ID          int64     `json:"id"`
	StudentID   int64     `json:"student_id"`
	ProductID   int64     `json:"product_id"`
	ProductName string    `json:"product_name"`
	Price       int       `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateExchangeRequest struct {
	StudentID int64 `json:"student_id"`
	ProductID int64 `json:"product_id"`
}
