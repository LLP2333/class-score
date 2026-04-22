package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateRecord(req model.CreateRecordRequest) (*model.ScoreRecord, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT INTO score_records (student_id, group_id, rule_id, score, reason) VALUES (?, ?, ?, ?, ?)",
		req.StudentID, req.GroupID, req.RuleID, req.Score, req.Reason,
	)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(
		"UPDATE students SET total_score = total_score + ? WHERE id = ?",
		req.Score, req.StudentID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetRecordByID(id)
}

func (s *SQLiteStore) GetRecordByID(id int64) (*model.ScoreRecord, error) {
	r := &model.ScoreRecord{}
	err := s.db.QueryRow(
		"SELECT id, student_id, group_id, rule_id, score, reason, created_at FROM score_records WHERE id = ?", id,
	).Scan(&r.ID, &r.StudentID, &r.GroupID, &r.RuleID, &r.Score, &r.Reason, &r.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return r, err
}

func (s *SQLiteStore) GetRecordsByClass(classID int64, limit int) ([]model.ScoreRecord, error) {
	if limit <= 0 {
		limit = 500
	}
	rows, err := s.db.Query(`
		SELECT r.id, r.student_id, r.group_id, r.rule_id, r.score, r.reason, r.created_at
		FROM score_records r
		JOIN students s ON r.student_id = s.id
		WHERE s.class_id = ?
		ORDER BY r.created_at DESC
		LIMIT ?`, classID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []model.ScoreRecord
	for rows.Next() {
		var r model.ScoreRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.GroupID, &r.RuleID, &r.Score, &r.Reason, &r.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, nil
}

func (s *SQLiteStore) GetRecordsByStudent(studentID int64) ([]model.ScoreRecord, error) {
	rows, err := s.db.Query(
		"SELECT id, student_id, group_id, rule_id, score, reason, created_at FROM score_records WHERE student_id = ? ORDER BY created_at DESC",
		studentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []model.ScoreRecord
	for rows.Next() {
		var r model.ScoreRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.GroupID, &r.RuleID, &r.Score, &r.Reason, &r.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, nil
}

func (s *SQLiteStore) UpdateRecord(id int64, req model.UpdateRecordRequest) (*model.ScoreRecord, error) {
	old, err := s.GetRecordByID(id)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	newScore := old.Score
	if req.Score != nil {
		newScore = *req.Score
	}
	newReason := old.Reason
	if req.Reason != nil {
		newReason = *req.Reason
	}

	scoreDelta := newScore - old.Score

	if _, err := tx.Exec(
		"UPDATE score_records SET score = ?, reason = ?, rule_id = ? WHERE id = ?",
		newScore, newReason, req.RuleID, id,
	); err != nil {
		return nil, err
	}

	if scoreDelta != 0 {
		if _, err := tx.Exec(
			"UPDATE students SET total_score = total_score + ? WHERE id = ?",
			scoreDelta, old.StudentID,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetRecordByID(id)
}

func (s *SQLiteStore) DeleteRecord(id int64) error {
	old, err := s.GetRecordByID(id)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM score_records WHERE id = ?", id); err != nil {
		return err
	}

	if _, err := tx.Exec(
		"UPDATE students SET total_score = total_score - ? WHERE id = ?",
		old.Score, old.StudentID,
	); err != nil {
		return err
	}

	return tx.Commit()
}

func (s *SQLiteStore) GetRecordClassID(recordID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow(`
		SELECT s.class_id FROM score_records r
		JOIN students s ON r.student_id = s.id
		WHERE r.id = ?`, recordID,
	).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}
