package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateClass(name, teacherName string, teacherID int64) (*model.Class, error) {
	result, err := s.db.Exec(
		"INSERT INTO classes (name, teacher_name, teacher_id) VALUES (?, ?, ?)",
		name, teacherName, teacherID,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetClassByID(id)
}

func (s *SQLiteStore) GetClassByID(id int64) (*model.Class, error) {
	c := &model.Class{}
	err := s.db.QueryRow(
		"SELECT id, name, teacher_name, teacher_id, created_at FROM classes WHERE id = ?", id,
	).Scan(&c.ID, &c.Name, &c.TeacherName, &c.TeacherID, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return c, err
}

func (s *SQLiteStore) GetClassesByTeacher(teacherID int64) ([]model.Class, error) {
	rows, err := s.db.Query(
		"SELECT id, name, teacher_name, teacher_id, created_at FROM classes WHERE teacher_id = ? ORDER BY created_at",
		teacherID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []model.Class
	for rows.Next() {
		var c model.Class
		if err := rows.Scan(&c.ID, &c.Name, &c.TeacherName, &c.TeacherID, &c.CreatedAt); err != nil {
			return nil, err
		}
		classes = append(classes, c)
	}
	return classes, nil
}

func (s *SQLiteStore) UpdateClass(id int64, req model.UpdateClassRequest) (*model.Class, error) {
	c, err := s.GetClassByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.TeacherName != nil {
		c.TeacherName = *req.TeacherName
	}

	_, err = s.db.Exec(
		"UPDATE classes SET name = ?, teacher_name = ? WHERE id = ?",
		c.Name, c.TeacherName, id,
	)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (s *SQLiteStore) DeleteClass(id int64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Collect user_ids of students in this class
	var userIDs []int64
	rows, err := tx.Query("SELECT user_id FROM students WHERE class_id = ? AND user_id IS NOT NULL", id)
	if err != nil {
		return err
	}
	for rows.Next() {
		var uid int64
		if err := rows.Scan(&uid); err != nil {
			rows.Close()
			return err
		}
		userIDs = append(userIDs, uid)
	}
	rows.Close()

	// Detach user accounts from students in this class so CASCADE won't hit FK on users
	_, err = tx.Exec("UPDATE students SET user_id = NULL WHERE class_id = ?", id)
	if err != nil {
		return err
	}

	// Delete the class (CASCADE removes students, groups, rules, records, etc.)
	_, err = tx.Exec("DELETE FROM classes WHERE id = ?", id)
	if err != nil {
		return err
	}

	// Clean up orphaned student user accounts (not referenced by any other student)
	for _, uid := range userIDs {
		var refCount int
		tx.QueryRow("SELECT COUNT(*) FROM students WHERE user_id = ?", uid).Scan(&refCount)
		if refCount == 0 {
			tx.Exec("DELETE FROM users WHERE id = ? AND role = 'student'", uid)
		}
	}

	return tx.Commit()
}

func (s *SQLiteStore) IsClassOwner(classID, teacherID int64) (bool, error) {
	var count int
	err := s.db.QueryRow(
		"SELECT COUNT(*) FROM classes WHERE id = ? AND teacher_id = ?", classID, teacherID,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
