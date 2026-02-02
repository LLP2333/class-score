package store

import (
	"database/sql"
	"errors"
	"time"

	"classScore-backend/internal/model"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists   = errors.New("用户名已存在")
	ErrUserNotFound = errors.New("用户不存在")
	ErrInvalidPass  = errors.New("密码错误")
)

// SQLiteStore SQLite存储
type SQLiteStore struct {
	db *sql.DB
}

// NewSQLiteStore 创建SQLite存储实例
func NewSQLiteStore(dbPath string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// 测试连接
	if err := db.Ping(); err != nil {
		return nil, err
	}

	store := &SQLiteStore{db: db}

	// 初始化表结构
	if err := store.initTables(); err != nil {
		return nil, err
	}

	return store, nil
}

// initTables 初始化数据库表
func (s *SQLiteStore) initTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
	`
	_, err := s.db.Exec(query)
	return err
}

// Close 关闭数据库连接
func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

// HashPassword 密码哈希
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword 验证密码
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// CreateUser 创建用户
func (s *SQLiteStore) CreateUser(username, password string) (*model.User, error) {
	// 检查用户名是否已存在
	exists, err := s.UserExists(username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUserExists
	}

	// 密码哈希
	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	// 插入用户
	now := time.Now()
	result, err := s.db.Exec(
		"INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)",
		username, hash, now, now,
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
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// UserExists 检查用户名是否存在
func (s *SQLiteStore) UserExists(username string) (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", username).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetUserByUsername 根据用户名获取用户
func (s *SQLiteStore) GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	err := s.db.QueryRow(
		"SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

// ValidateUser 验证用户登录
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

// UpdateUserPassword 更新用户密码
func (s *SQLiteStore) UpdateUserPassword(username, newPassword string) error {
	hash, err := HashPassword(newPassword)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		"UPDATE users SET password_hash = ?, updated_at = ? WHERE username = ?",
		hash, time.Now(), username,
	)
	return err
}
