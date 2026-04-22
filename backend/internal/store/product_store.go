package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateProduct(classID int64, req model.CreateProductRequest) (*model.Product, error) {
	icon := req.Icon
	if icon == "" {
		icon = "🎁"
	}
	stock := req.Stock
	if stock <= 0 {
		stock = 10
	}

	result, err := s.db.Exec(
		"INSERT INTO products (name, price, stock, icon, exchange_count, class_id) VALUES (?, ?, ?, ?, 0, ?)",
		req.Name, req.Price, stock, icon, classID,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetProductByID(id)
}

func (s *SQLiteStore) GetProductByID(id int64) (*model.Product, error) {
	p := &model.Product{}
	err := s.db.QueryRow(
		"SELECT id, name, price, stock, icon, exchange_count, class_id FROM products WHERE id = ?", id,
	).Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Icon, &p.ExchangeCount, &p.ClassID)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return p, err
}

func (s *SQLiteStore) GetProductsByClass(classID int64) ([]model.Product, error) {
	rows, err := s.db.Query(
		"SELECT id, name, price, stock, icon, exchange_count, class_id FROM products WHERE class_id = ?",
		classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Icon, &p.ExchangeCount, &p.ClassID); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (s *SQLiteStore) UpdateProduct(id int64, req model.UpdateProductRequest) (*model.Product, error) {
	p, err := s.GetProductByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.Price != nil {
		p.Price = *req.Price
	}
	if req.Stock != nil {
		p.Stock = *req.Stock
	}
	if req.Icon != nil {
		p.Icon = *req.Icon
	}

	_, err = s.db.Exec(
		"UPDATE products SET name = ?, price = ?, stock = ?, icon = ? WHERE id = ?",
		p.Name, p.Price, p.Stock, p.Icon, id,
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (s *SQLiteStore) DeleteProduct(id int64) error {
	_, err := s.db.Exec("DELETE FROM products WHERE id = ?", id)
	return err
}

func (s *SQLiteStore) GetProductClassID(productID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow("SELECT class_id FROM products WHERE id = ?", productID).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}

// Exchanges

func (s *SQLiteStore) CreateExchange(classID int64, req model.CreateExchangeRequest) (*model.Exchange, error) {
	p, err := s.GetProductByID(req.ProductID)
	if err != nil {
		return nil, err
	}
	if p.Stock <= 0 {
		return nil, ErrForbidden
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT INTO exchanges (student_id, product_id, product_name, price) VALUES (?, ?, ?, ?)",
		req.StudentID, req.ProductID, p.Name, p.Price,
	)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(
		"UPDATE products SET stock = stock - 1, exchange_count = exchange_count + 1 WHERE id = ?",
		req.ProductID,
	); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(
		"UPDATE students SET total_score = total_score - ? WHERE id = ?",
		p.Price, req.StudentID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetExchangeByID(id)
}

func (s *SQLiteStore) GetExchangeByID(id int64) (*model.Exchange, error) {
	e := &model.Exchange{}
	err := s.db.QueryRow(
		"SELECT id, student_id, product_id, product_name, price, created_at FROM exchanges WHERE id = ?", id,
	).Scan(&e.ID, &e.StudentID, &e.ProductID, &e.ProductName, &e.Price, &e.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return e, err
}

func (s *SQLiteStore) GetExchangesByClass(classID int64) ([]model.Exchange, error) {
	rows, err := s.db.Query(`
		SELECT e.id, e.student_id, e.product_id, e.product_name, e.price, e.created_at
		FROM exchanges e
		JOIN students s ON e.student_id = s.id
		WHERE s.class_id = ?
		ORDER BY e.created_at DESC`, classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exchanges []model.Exchange
	for rows.Next() {
		var e model.Exchange
		if err := rows.Scan(&e.ID, &e.StudentID, &e.ProductID, &e.ProductName, &e.Price, &e.CreatedAt); err != nil {
			return nil, err
		}
		exchanges = append(exchanges, e)
	}
	return exchanges, nil
}
