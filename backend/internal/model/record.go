package model

import "time"

type ScoreRecord struct {
	ID        int64     `json:"id"`
	StudentID int64     `json:"student_id"`
	GroupID   *int64    `json:"group_id"`
	RuleID    *int64    `json:"rule_id"`
	Score     int       `json:"score"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateRecordRequest struct {
	StudentID int64  `json:"student_id"`
	GroupID   *int64 `json:"group_id"`
	RuleID    *int64 `json:"rule_id"`
	Score     int    `json:"score"`
	Reason    string `json:"reason"`
}

type UpdateRecordRequest struct {
	Score  *int    `json:"score,omitempty"`
	Reason *string `json:"reason,omitempty"`
	RuleID *int64  `json:"rule_id"`
}
