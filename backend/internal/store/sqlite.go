package store

import (
	"database/sql"
	"errors"
	"log"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists   = errors.New("用户名已存在")
	ErrUserNotFound = errors.New("用户不存在")
	ErrInvalidPass  = errors.New("密码错误")
	ErrNotFound     = errors.New("记录不存在")
	ErrForbidden    = errors.New("无权限操作")
)

type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(dbPath string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_foreign_keys=on")
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	store := &SQLiteStore{db: db}

	if err := store.migrate(); err != nil {
		return nil, err
	}

	return store, nil
}

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

func (s *SQLiteStore) DB() *sql.DB {
	return s.db
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *SQLiteStore) migrate() error {
	var version int
	err := s.db.QueryRow("SELECT COALESCE(MAX(version),0) FROM schema_version").Scan(&version)
	if err != nil {
		// table doesn't exist yet, start from 0
		version = 0
	}

	migrations := []struct {
		version int
		fn      func() error
	}{
		{1, func() error { _, err := s.db.Exec(migrationV1); return err }},
		{2, s.migrateV2},
		{3, s.migrateV3},
	}

	for _, m := range migrations {
		if m.version <= version {
			continue
		}
		log.Printf("应用数据库迁移 v%d ...", m.version)
		if err := m.fn(); err != nil {
			return err
		}
		if _, err := s.db.Exec("INSERT INTO schema_version(version) VALUES(?)", m.version); err != nil {
			return err
		}
	}

	return nil
}

const migrationV1 = `
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher_name TEXT NOT NULL DEFAULT '',
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color INTEGER DEFAULT 1,
    leader_id INTEGER,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_groups_class ON groups(class_id);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar INTEGER DEFAULT 1,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id),
    total_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);

CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT '其他',
    icon TEXT DEFAULT '📌',
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rules_class ON rules(class_id);

CREATE TABLE IF NOT EXISTS score_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    rule_id INTEGER REFERENCES rules(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_records_student ON score_records(student_id);
CREATE INDEX IF NOT EXISTS idx_records_created ON score_records(created_at);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT 10,
    icon TEXT DEFAULT '🎁',
    exchange_count INTEGER DEFAULT 0,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_products_class ON products(class_id);

CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exchanges_student ON exchanges(student_id);

CREATE TABLE IF NOT EXISTS roll_call_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_names TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER UNIQUE NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    animation_speed TEXT DEFAULT 'normal',
    sound_enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pet_species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    element TEXT NOT NULL,
    color TEXT,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pet_species_class ON pet_species(class_id);

CREATE TABLE IF NOT EXISTS pet_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id INTEGER NOT NULL REFERENCES pet_species(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    image TEXT,
    min_score INTEGER NOT NULL,
    description TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_pet_stages_species ON pet_stages(species_id);

CREATE TABLE IF NOT EXISTS student_pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    species_id INTEGER NOT NULL REFERENCES pet_species(id) ON DELETE CASCADE,
    nickname TEXT DEFAULT '我的宠物',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pet_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER UNIQUE NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enabled INTEGER DEFAULT 1,
    show_on_student_card INTEGER DEFAULT 1
);
`

func (s *SQLiteStore) migrateV3() error {
	rows, err := s.db.Query(`
		SELECT s.id, s.class_id, s.name, s.user_id
		FROM students s
		WHERE s.user_id IS NOT NULL`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type rec struct {
		classID int64
		name    string
		userID  int64
	}
	var recs []rec
	for rows.Next() {
		var r rec
		var sid int64
		if err := rows.Scan(&sid, &r.classID, &r.name, &r.userID); err != nil {
			return err
		}
		recs = append(recs, r)
	}

	for _, r := range recs {
		newUsername := StudentUsername(r.classID, r.name)
		if _, err := s.db.Exec(
			"UPDATE users SET username = ? WHERE id = ? AND role = 'student'",
			newUsername, r.userID,
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *SQLiteStore) migrateV2() error {
	var count int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='role'`).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		if _, err := s.db.Exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'teacher'`); err != nil {
			return err
		}
	}
	return nil
}
