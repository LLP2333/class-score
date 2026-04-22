package store

import (
	"database/sql"
	"time"

	"classScore-backend/internal/model"
)

func (s *SQLiteStore) CreateUser(username, password, role string) (*model.User, error) {
	exists, err := s.UserExists(username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUserExists
	}

	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	result, err := s.db.Exec(
		"INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		username, hash, role, now, now,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &model.User{
		ID:        id,
		Username:  username,
		Role:      role,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (s *SQLiteStore) UserExists(username string) (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", username).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *SQLiteStore) GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	err := s.db.QueryRow(
		"SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *SQLiteStore) GetUserByID(id int64) (*model.User, error) {
	user := &model.User{}
	err := s.db.QueryRow(
		"SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *SQLiteStore) ValidateUser(username, password string) (*model.User, error) {
	user, err := s.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}

	if !CheckPassword(password, user.PasswordHash) {
		return nil, ErrInvalidPass
	}

	return user, nil
}

func (s *SQLiteStore) UpdateUserPassword(userID int64, newPassword string) error {
	hash, err := HashPassword(newPassword)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		"UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
		hash, time.Now(), userID,
	)
	return err
}

func (s *SQLiteStore) DeleteUser(id int64) error {
	_, err := s.db.Exec("DELETE FROM users WHERE id = ?", id)
	return err
}
