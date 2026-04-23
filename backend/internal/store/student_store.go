package store

import (
	"database/sql"
	"fmt"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateStudent(classID int64, name string, avatar int, groupID *int64, password string) (*model.Student, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create student user account with unique username
	username := name
	baseName := name
	counter := 1
	for {
		var exists int
		err := tx.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", username).Scan(&exists)
		if err != nil {
			return nil, err
		}
		if exists == 0 {
			break
		}
		counter++
		username = fmt.Sprintf("%s_%d", baseName, counter)
	}

	if password == "" {
		password = "123456"
	}

	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	userResult, err := tx.Exec(
		"INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'student')",
		username, hash,
	)
	if err != nil {
		return nil, err
	}
	userID, _ := userResult.LastInsertId()

	result, err := tx.Exec(
		"INSERT INTO students (name, avatar, class_id, group_id, user_id, total_score) VALUES (?, ?, ?, ?, ?, 0)",
		name, avatar, classID, groupID, userID,
	)
	if err != nil {
		return nil, err
	}

	studentID, _ := result.LastInsertId()

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetStudentByID(studentID)
}

func (s *SQLiteStore) GetStudentByID(id int64) (*model.Student, error) {
	st := &model.Student{}
	var username sql.NullString
	err := s.db.QueryRow(`
		SELECT s.id, s.name, s.avatar, s.class_id, s.group_id, s.user_id, s.total_score, s.created_at,
		       COALESCE(u.username, '') as username
		FROM students s
		LEFT JOIN users u ON s.user_id = u.id
		WHERE s.id = ?`, id,
	).Scan(&st.ID, &st.Name, &st.Avatar, &st.ClassID, &st.GroupID, &st.UserID, &st.TotalScore, &st.CreatedAt, &username)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if username.Valid {
		st.Username = username.String
	}
	return st, nil
}

func (s *SQLiteStore) GetStudentsByClass(classID int64) ([]model.Student, error) {
	rows, err := s.db.Query(`
		SELECT s.id, s.name, s.avatar, s.class_id, s.group_id, s.user_id, s.total_score, s.created_at,
		       COALESCE(u.username, '') as username
		FROM students s
		LEFT JOIN users u ON s.user_id = u.id
		WHERE s.class_id = ?
		ORDER BY s.created_at`, classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []model.Student
	for rows.Next() {
		var st model.Student
		var username sql.NullString
		if err := rows.Scan(&st.ID, &st.Name, &st.Avatar, &st.ClassID, &st.GroupID, &st.UserID, &st.TotalScore, &st.CreatedAt, &username); err != nil {
			return nil, err
		}
		if username.Valid {
			st.Username = username.String
		}
		students = append(students, st)
	}
	return students, nil
}

func (s *SQLiteStore) UpdateStudent(id int64, req model.UpdateStudentRequest) (*model.Student, error) {
	st, err := s.GetStudentByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		st.Name = *req.Name
	}
	if req.Avatar != nil {
		st.Avatar = *req.Avatar
	}

	_, err = s.db.Exec(
		"UPDATE students SET name = ?, avatar = ?, group_id = ? WHERE id = ?",
		st.Name, st.Avatar, req.GroupID, id,
	)
	if err != nil {
		return nil, err
	}
	return s.GetStudentByID(id)
}

func (s *SQLiteStore) DeleteStudent(id int64) error {
	st, err := s.GetStudentByID(id)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM students WHERE id = ?", id); err != nil {
		return err
	}

	if st.UserID != nil {
		if _, err := tx.Exec("DELETE FROM users WHERE id = ?", *st.UserID); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SQLiteStore) UpdateStudentScore(studentID int64, delta int) error {
	_, err := s.db.Exec(
		"UPDATE students SET total_score = total_score + ? WHERE id = ?",
		delta, studentID,
	)
	return err
}

func (s *SQLiteStore) SetStudentScore(studentID int64, score int) error {
	_, err := s.db.Exec(
		"UPDATE students SET total_score = ? WHERE id = ?",
		score, studentID,
	)
	return err
}

func (s *SQLiteStore) GetStudentByUserID(userID int64) (*model.Student, error) {
	st := &model.Student{}
	err := s.db.QueryRow(`
		SELECT s.id, s.name, s.avatar, s.class_id, s.group_id, s.user_id, s.total_score, s.created_at
		FROM students s WHERE s.user_id = ?`, userID,
	).Scan(&st.ID, &st.Name, &st.Avatar, &st.ClassID, &st.GroupID, &st.UserID, &st.TotalScore, &st.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return st, err
}

func (s *SQLiteStore) ResetStudentPassword(studentID int64, newPassword string) error {
	st, err := s.GetStudentByID(studentID)
	if err != nil {
		return err
	}
	if st.UserID == nil {
		return ErrNotFound
	}
	return s.UpdateUserPassword(*st.UserID, newPassword)
}

func (s *SQLiteStore) StudentExistsInClass(classID int64, name string) (bool, error) {
	var count int
	err := s.db.QueryRow(
		"SELECT COUNT(*) FROM students WHERE class_id = ? AND name = ?", classID, name,
	).Scan(&count)
	return count > 0, err
}

func (s *SQLiteStore) GetStudentClassID(studentID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow("SELECT class_id FROM students WHERE id = ?", studentID).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}
