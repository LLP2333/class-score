package model

import "time"

type ClassSettings struct {
	ID                         int64  `json:"id"`
	ClassID                    int64  `json:"class_id"`
	Theme                      string `json:"theme"`
	AnimationSpeed             string `json:"animation_speed"`
	SoundEnabled               bool   `json:"sound_enabled"`
	RollCallCount              int    `json:"roll_call_count"`
	RollCallExcludeRecentCount int    `json:"roll_call_exclude_recent_count"`
}

type UpdateSettingsRequest struct {
	Theme                      *string `json:"theme,omitempty"`
	AnimationSpeed             *string `json:"animation_speed,omitempty"`
	SoundEnabled               *bool   `json:"sound_enabled,omitempty"`
	RollCallCount              *int    `json:"roll_call_count,omitempty"`
	RollCallExcludeRecentCount *int    `json:"roll_call_exclude_recent_count,omitempty"`
}

type RollCallRecord struct {
	ID           int64     `json:"id"`
	ClassID      int64     `json:"class_id"`
	StudentNames []string  `json:"student_names"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateRollCallRequest struct {
	StudentNames []string `json:"student_names"`
}

type CreateRandomRollCallRequest struct {
	Count              int `json:"count"`
	ExcludeRecentCount int `json:"exclude_recent_count"`
}
