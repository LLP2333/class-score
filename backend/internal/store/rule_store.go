package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateRule(classID int64, req model.CreateRuleRequest) (*model.Rule, error) {
	cat := req.Category
	if cat == "" {
		cat = "其他"
	}
	icon := req.Icon
	if icon == "" {
		icon = "📌"
	}

	result, err := s.db.Exec(
		"INSERT INTO rules (name, score, type, category, icon, class_id) VALUES (?, ?, ?, ?, ?, ?)",
		req.Name, req.Score, req.Type, cat, icon, classID,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetRuleByID(id)
}

func (s *SQLiteStore) GetRuleByID(id int64) (*model.Rule, error) {
	r := &model.Rule{}
	err := s.db.QueryRow(
		"SELECT id, name, score, type, category, icon, class_id FROM rules WHERE id = ?", id,
	).Scan(&r.ID, &r.Name, &r.Score, &r.Type, &r.Category, &r.Icon, &r.ClassID)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return r, err
}

func (s *SQLiteStore) GetRulesByClass(classID int64) ([]model.Rule, error) {
	rows, err := s.db.Query(
		"SELECT id, name, score, type, category, icon, class_id FROM rules WHERE class_id = ?",
		classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []model.Rule
	for rows.Next() {
		var r model.Rule
		if err := rows.Scan(&r.ID, &r.Name, &r.Score, &r.Type, &r.Category, &r.Icon, &r.ClassID); err != nil {
			return nil, err
		}
		rules = append(rules, r)
	}
	return rules, nil
}

func (s *SQLiteStore) UpdateRule(id int64, req model.UpdateRuleRequest) (*model.Rule, error) {
	r, err := s.GetRuleByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		r.Name = *req.Name
	}
	if req.Score != nil {
		r.Score = *req.Score
	}
	if req.Type != nil {
		r.Type = *req.Type
	}
	if req.Category != nil {
		r.Category = *req.Category
	}
	if req.Icon != nil {
		r.Icon = *req.Icon
	}

	_, err = s.db.Exec(
		"UPDATE rules SET name = ?, score = ?, type = ?, category = ?, icon = ? WHERE id = ?",
		r.Name, r.Score, r.Type, r.Category, r.Icon, id,
	)
	if err != nil {
		return nil, err
	}
	return r, nil
}

func (s *SQLiteStore) DeleteRule(id int64) error {
	_, err := s.db.Exec("DELETE FROM rules WHERE id = ?", id)
	return err
}

func (s *SQLiteStore) GetRuleClassID(ruleID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow("SELECT class_id FROM rules WHERE id = ?", ruleID).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}
