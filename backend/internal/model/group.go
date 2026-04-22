package model

import "time"

type Group struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Color     int       `json:"color"`
	LeaderID  *int64    `json:"leader_id"`
	ClassID   int64     `json:"class_id"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateGroupRequest struct {
	Name     string `json:"name"`
	Color    int    `json:"color"`
	LeaderID *int64 `json:"leader_id"`
}

type UpdateGroupRequest struct {
	Name     *string `json:"name,omitempty"`
	Color    *int    `json:"color,omitempty"`
	LeaderID *int64  `json:"leader_id"`
}
