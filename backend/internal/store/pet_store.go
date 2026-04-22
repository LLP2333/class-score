package store

import (
	"database/sql"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreatePetSpecies(classID int64, req model.CreatePetSpeciesRequest) (*model.PetSpecies, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT INTO pet_species (name, element, color, class_id) VALUES (?, ?, ?, ?)",
		req.Name, req.Element, req.Color, classID,
	)
	if err != nil {
		return nil, err
	}

	speciesID, _ := result.LastInsertId()

	for _, stage := range req.Stages {
		if _, err := tx.Exec(
			"INSERT INTO pet_stages (species_id, level, name, emoji, image, min_score, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
			speciesID, stage.Level, stage.Name, stage.Emoji, stage.Image, stage.MinScore, stage.Description,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetPetSpeciesByID(speciesID)
}

func (s *SQLiteStore) GetPetSpeciesByID(id int64) (*model.PetSpecies, error) {
	sp := &model.PetSpecies{}
	err := s.db.QueryRow(
		"SELECT id, name, element, COALESCE(color,''), class_id FROM pet_species WHERE id = ?", id,
	).Scan(&sp.ID, &sp.Name, &sp.Element, &sp.Color, &sp.ClassID)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	stages, err := s.GetPetStages(id)
	if err != nil {
		return nil, err
	}
	sp.Stages = stages
	return sp, nil
}

func (s *SQLiteStore) GetPetStages(speciesID int64) ([]model.PetStage, error) {
	rows, err := s.db.Query(
		"SELECT id, species_id, level, name, emoji, COALESCE(image,''), min_score, description FROM pet_stages WHERE species_id = ? ORDER BY level",
		speciesID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stages []model.PetStage
	for rows.Next() {
		var st model.PetStage
		if err := rows.Scan(&st.ID, &st.SpeciesID, &st.Level, &st.Name, &st.Emoji, &st.Image, &st.MinScore, &st.Description); err != nil {
			return nil, err
		}
		stages = append(stages, st)
	}
	return stages, nil
}

func (s *SQLiteStore) GetPetSpeciesByClass(classID int64) ([]model.PetSpecies, error) {
	rows, err := s.db.Query(
		"SELECT id, name, element, COALESCE(color,''), class_id FROM pet_species WHERE class_id = ?",
		classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var species []model.PetSpecies
	for rows.Next() {
		var sp model.PetSpecies
		if err := rows.Scan(&sp.ID, &sp.Name, &sp.Element, &sp.Color, &sp.ClassID); err != nil {
			return nil, err
		}
		stages, err := s.GetPetStages(sp.ID)
		if err != nil {
			return nil, err
		}
		sp.Stages = stages
		species = append(species, sp)
	}
	return species, nil
}

func (s *SQLiteStore) UpdatePetSpecies(id int64, req model.UpdatePetSpeciesRequest) (*model.PetSpecies, error) {
	sp, err := s.GetPetSpeciesByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		sp.Name = *req.Name
	}
	if req.Element != nil {
		sp.Element = *req.Element
	}
	if req.Color != nil {
		sp.Color = *req.Color
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		"UPDATE pet_species SET name = ?, element = ?, color = ? WHERE id = ?",
		sp.Name, sp.Element, sp.Color, id,
	); err != nil {
		return nil, err
	}

	if req.Stages != nil {
		if _, err := tx.Exec("DELETE FROM pet_stages WHERE species_id = ?", id); err != nil {
			return nil, err
		}
		for _, stage := range req.Stages {
			if _, err := tx.Exec(
				"INSERT INTO pet_stages (species_id, level, name, emoji, image, min_score, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
				id, stage.Level, stage.Name, stage.Emoji, stage.Image, stage.MinScore, stage.Description,
			); err != nil {
				return nil, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetPetSpeciesByID(id)
}

func (s *SQLiteStore) DeletePetSpecies(id int64) error {
	_, err := s.db.Exec("DELETE FROM pet_species WHERE id = ?", id)
	return err
}

func (s *SQLiteStore) GetPetSpeciesClassID(speciesID int64) (int64, error) {
	var classID int64
	err := s.db.QueryRow("SELECT class_id FROM pet_species WHERE id = ?", speciesID).Scan(&classID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	return classID, err
}

// Student Pets

func (s *SQLiteStore) AssignPet(studentID, speciesID int64, nickname string) (*model.StudentPet, error) {
	if nickname == "" {
		nickname = "我的宠物"
	}

	var existingID int64
	err := s.db.QueryRow("SELECT id FROM student_pets WHERE student_id = ?", studentID).Scan(&existingID)
	if err == nil {
		_, err = s.db.Exec(
			"UPDATE student_pets SET species_id = ?, nickname = ? WHERE student_id = ?",
			speciesID, nickname, studentID,
		)
	} else {
		_, err = s.db.Exec(
			"INSERT INTO student_pets (student_id, species_id, nickname) VALUES (?, ?, ?)",
			studentID, speciesID, nickname,
		)
	}
	if err != nil {
		return nil, err
	}

	return s.GetStudentPet(studentID)
}

func (s *SQLiteStore) GetStudentPet(studentID int64) (*model.StudentPet, error) {
	p := &model.StudentPet{}
	err := s.db.QueryRow(
		"SELECT id, student_id, species_id, nickname, assigned_at FROM student_pets WHERE student_id = ?", studentID,
	).Scan(&p.ID, &p.StudentID, &p.SpeciesID, &p.Nickname, &p.AssignedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return p, err
}

func (s *SQLiteStore) GetStudentPetsByClass(classID int64) ([]model.StudentPet, error) {
	rows, err := s.db.Query(`
		SELECT sp.id, sp.student_id, sp.species_id, sp.nickname, sp.assigned_at
		FROM student_pets sp
		JOIN students s ON sp.student_id = s.id
		WHERE s.class_id = ?`, classID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pets []model.StudentPet
	for rows.Next() {
		var p model.StudentPet
		if err := rows.Scan(&p.ID, &p.StudentID, &p.SpeciesID, &p.Nickname, &p.AssignedAt); err != nil {
			return nil, err
		}
		pets = append(pets, p)
	}
	return pets, nil
}

func (s *SQLiteStore) RemoveStudentPet(studentID int64) error {
	_, err := s.db.Exec("DELETE FROM student_pets WHERE student_id = ?", studentID)
	return err
}

// Pet Config

func (s *SQLiteStore) GetPetConfig(classID int64) (*model.PetConfig, error) {
	pc := &model.PetConfig{}
	var enabled, showCard int
	err := s.db.QueryRow(
		"SELECT id, class_id, enabled, show_on_student_card FROM pet_config WHERE class_id = ?", classID,
	).Scan(&pc.ID, &pc.ClassID, &enabled, &showCard)
	if err == sql.ErrNoRows {
		return &model.PetConfig{ClassID: classID, Enabled: true, ShowOnStudentCard: true}, nil
	}
	if err != nil {
		return nil, err
	}
	pc.Enabled = enabled == 1
	pc.ShowOnStudentCard = showCard == 1
	return pc, nil
}

func (s *SQLiteStore) UpdatePetConfig(classID int64, req model.UpdatePetConfigRequest) (*model.PetConfig, error) {
	current, err := s.GetPetConfig(classID)
	if err != nil {
		return nil, err
	}

	if req.Enabled != nil {
		current.Enabled = *req.Enabled
	}
	if req.ShowOnStudentCard != nil {
		current.ShowOnStudentCard = *req.ShowOnStudentCard
	}

	enabledInt := 0
	if current.Enabled {
		enabledInt = 1
	}
	showCardInt := 0
	if current.ShowOnStudentCard {
		showCardInt = 1
	}

	if current.ID == 0 {
		_, err = s.db.Exec(
			"INSERT INTO pet_config (class_id, enabled, show_on_student_card) VALUES (?, ?, ?)",
			classID, enabledInt, showCardInt,
		)
	} else {
		_, err = s.db.Exec(
			"UPDATE pet_config SET enabled = ?, show_on_student_card = ? WHERE class_id = ?",
			enabledInt, showCardInt, classID,
		)
	}
	if err != nil {
		return nil, err
	}

	return s.GetPetConfig(classID)
}
