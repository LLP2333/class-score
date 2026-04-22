package model

type Rule struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Score    int    `json:"score"`
	Type     string `json:"type"` // "add" | "minus"
	Category string `json:"category"`
	Icon     string `json:"icon"`
	ClassID  int64  `json:"class_id"`
}

type CreateRuleRequest struct {
	Name     string `json:"name"`
	Score    int    `json:"score"`
	Type     string `json:"type"`
	Category string `json:"category"`
	Icon     string `json:"icon"`
}

type UpdateRuleRequest struct {
	Name     *string `json:"name,omitempty"`
	Score    *int    `json:"score,omitempty"`
	Type     *string `json:"type,omitempty"`
	Category *string `json:"category,omitempty"`
	Icon     *string `json:"icon,omitempty"`
}
