package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateGroup(classID int64, name string, color int, leaderID *int64) (*model.Group, error) {
	result, err := s.db.Exec(
		"INSERT INTO groups (name, color, leader_id, class_id) VALUES (?, ?, ?, ?)",
		name, color, leaderID, classID,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetGroupByID(id)
}

func (s *SQLiteStore) GetGroupByID(id int64) (*model.Group, error) {
	g := &model.Group{}
	err := s.db.QueryRow(
		"SELECT id, name, color, leader_id, class_id, created_at FROM groups WHERE id = ?", id,
	).Scan(&g.ID, &g.Name, &g.Color, &g.LeaderID, &g.ClassID, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return g, err
}

func (s *SQLiteStore) GetGroupsByClass(classID int64) ([]model.Group, error) {
	rows, err := s.db.Query(
		"SELECT id, name, color, leader_id, class_id, created_at FROM groups WHERE class_id = ? ORDER BY created_at",
		classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []model.Group
	for rows.Next() {
		var g model.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Color, &g.LeaderID, &g.ClassID, &g.CreatedAt); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (s *SQLiteStore) UpdateGroup(id int64, req model.UpdateGroupRequest) (*model.Group, error) {
	g, err := s.GetGroupByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		g.Name = *req.Name
	}
	if req.Color != nil {
		g.Color = *req.Color
	}

	_, err = s.db.Exec(
		"UPDATE groups SET name = ?, color = ?, leader_id = ? WHERE id = ?",
		g.Name, g.Color, req.LeaderID, id,
	)
	if err != nil {
		return nil, err
	}
	return s.GetGroupByID(id)
}

func (s *SQLiteStore) DeleteGroup(id int64) error {
	_, err := s.db.Exec("DELETE FROM groups WHERE id = ?", id)
	return err
}

func (s *SQLiteStore) GetGroupClassID(groupID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow("SELECT class_id FROM groups WHERE id = ?", groupID).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}
