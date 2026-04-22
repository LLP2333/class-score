package store

import (
	"database/sql"
	"encoding/json"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) GetClassSettings(classID int64) (*model.ClassSettings, error) {
	cs := &model.ClassSettings{}
	var soundEnabled int
	err := s.db.QueryRow(
		"SELECT id, class_id, theme, animation_speed, sound_enabled FROM class_settings WHERE class_id = ?", classID,
	).Scan(&cs.ID, &cs.ClassID, &cs.Theme, &cs.AnimationSpeed, &soundEnabled)
	if err == sql.ErrNoRows {
		return &model.ClassSettings{ClassID: classID, Theme: "light", AnimationSpeed: "normal", SoundEnabled: true}, nil
	}
	if err != nil {
		return nil, err
	}
	cs.SoundEnabled = soundEnabled == 1
	return cs, nil
}

func (s *SQLiteStore) UpdateClassSettings(classID int64, req model.UpdateSettingsRequest) (*model.ClassSettings, error) {
	current, err := s.GetClassSettings(classID)
	if err != nil {
		return nil, err
	}

	if req.Theme != nil {
		current.Theme = *req.Theme
	}
	if req.AnimationSpeed != nil {
		current.AnimationSpeed = *req.AnimationSpeed
	}
	if req.SoundEnabled != nil {
		current.SoundEnabled = *req.SoundEnabled
	}

	soundInt := 0
	if current.SoundEnabled {
		soundInt = 1
	}

	if current.ID == 0 {
		_, err = s.db.Exec(
			"INSERT INTO class_settings (class_id, theme, animation_speed, sound_enabled) VALUES (?, ?, ?, ?)",
			classID, current.Theme, current.AnimationSpeed, soundInt,
		)
	} else {
		_, err = s.db.Exec(
			"UPDATE class_settings SET theme = ?, animation_speed = ?, sound_enabled = ? WHERE class_id = ?",
			current.Theme, current.AnimationSpeed, soundInt, classID,
		)
	}
	if err != nil {
		return nil, err
	}

	return s.GetClassSettings(classID)
}

// Roll Call Records

func (s *SQLiteStore) CreateRollCallRecord(classID int64, studentNames []string) (*model.RollCallRecord, error) {
	namesJSON, err := json.Marshal(studentNames)
	if err != nil {
		return nil, err
	}

	result, err := s.db.Exec(
		"INSERT INTO roll_call_records (class_id, student_names) VALUES (?, ?)",
		classID, string(namesJSON),
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return s.GetRollCallRecordByID(id)
}

func (s *SQLiteStore) GetRollCallRecordByID(id int64) (*model.RollCallRecord, error) {
	r := &model.RollCallRecord{}
	var namesStr string
	err := s.db.QueryRow(
		"SELECT id, class_id, student_names, created_at FROM roll_call_records WHERE id = ?", id,
	).Scan(&r.ID, &r.ClassID, &namesStr, &r.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	json.Unmarshal([]byte(namesStr), &r.StudentNames)
	return r, nil
}

func (s *SQLiteStore) GetRollCallRecordsByClass(classID int64, limit int) ([]model.RollCallRecord, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.db.Query(
		"SELECT id, class_id, student_names, created_at FROM roll_call_records WHERE class_id = ? ORDER BY created_at DESC LIMIT ?",
		classID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []model.RollCallRecord
	for rows.Next() {
		var r model.RollCallRecord
		var namesStr string
		if err := rows.Scan(&r.ID, &r.ClassID, &namesStr, &r.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal([]byte(namesStr), &r.StudentNames)
		records = append(records, r)
	}
	return records, nil
}
