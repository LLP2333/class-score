package model

import "time"

type Student struct {
	ID         int64     `json:"id"`
	Name       string    `json:"name"`
	Avatar     int       `json:"avatar"`
	ClassID    int64     `json:"class_id"`
	GroupID    *int64    `json:"group_id"`
	UserID     *int64    `json:"user_id,omitempty"`
	Username   string    `json:"username,omitempty"`
	TotalScore int       `json:"total_score"`
	CreatedAt  time.Time `json:"created_at"`
}

type CreateStudentRequest struct {
	Name     string `json:"name"`
	Avatar   int    `json:"avatar"`
	GroupID  *int64 `json:"group_id"`
	Password string `json:"password"`
}

type UpdateStudentRequest struct {
	Name    *string `json:"name,omitempty"`
	Avatar  *int    `json:"avatar,omitempty"`
	GroupID *int64  `json:"group_id"`
}

type ResetPasswordRequest struct {
	NewPassword string `json:"newPassword"`
}
