package model

import "time"

type PetSpecies struct {
	ID      int64      `json:"id"`
	Name    string     `json:"name"`
	Element string     `json:"element"`
	Color   string     `json:"color,omitempty"`
	ClassID int64      `json:"class_id"`
	Stages  []PetStage `json:"stages,omitempty"`
}

type PetStage struct {
	ID          int64  `json:"id"`
	SpeciesID   int64  `json:"species_id"`
	Level       int    `json:"level"`
	Name        string `json:"name"`
	Emoji       string `json:"emoji"`
	Image       string `json:"image,omitempty"`
	MinScore    int    `json:"min_score"`
	Description string `json:"description"`
}

type StudentPet struct {
	ID         int64     `json:"id"`
	StudentID  int64     `json:"student_id"`
	SpeciesID  int64     `json:"species_id"`
	Nickname   string    `json:"nickname"`
	AssignedAt time.Time `json:"assigned_at"`
}

type PetConfig struct {
	ID                int64 `json:"id"`
	ClassID           int64 `json:"class_id"`
	Enabled           bool  `json:"enabled"`
	ShowOnStudentCard bool  `json:"show_on_student_card"`
}

type CreatePetSpeciesRequest struct {
	Name    string     `json:"name"`
	Element string     `json:"element"`
	Color   string     `json:"color"`
	Stages  []PetStage `json:"stages"`
}

type UpdatePetSpeciesRequest struct {
	Name    *string    `json:"name,omitempty"`
	Element *string    `json:"element,omitempty"`
	Color   *string    `json:"color,omitempty"`
	Stages  []PetStage `json:"stages,omitempty"`
}

type AssignPetRequest struct {
	StudentID int64  `json:"student_id"`
	SpeciesID int64  `json:"species_id"`
	Nickname  string `json:"nickname"`
}

type UpdatePetConfigRequest struct {
	Enabled           *bool `json:"enabled,omitempty"`
	ShowOnStudentCard *bool `json:"show_on_student_card,omitempty"`
}
