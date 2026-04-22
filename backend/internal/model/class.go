package model

import "time"

type Class struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	TeacherName string    `json:"teacher_name"`
	TeacherID   int64     `json:"teacher_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateClassRequest struct {
	Name        string `json:"name"`
	TeacherName string `json:"teacher_name"`
}

type UpdateClassRequest struct {
	Name        *string `json:"name,omitempty"`
	TeacherName *string `json:"teacher_name,omitempty"`
}
