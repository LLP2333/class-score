package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"
)

var (
	ErrOTPNotFound = errors.New("OTP不存在或已失效")
	ErrOTPExpired  = errors.New("OTP已过期")
)

// OTPEntry 一次性密码条目（仅存于内存）
type OTPEntry struct {
	Username  string
	Password  string
	ExpiresAt time.Time
}

// OTPManager 进程内一次性密码管理器，重启即清空
type OTPManager struct {
	mu      sync.Mutex
	entries map[string]*OTPEntry
	ttl     time.Duration
}

func NewOTPManager(ttl time.Duration) *OTPManager {
	m := &OTPManager{
		entries: make(map[string]*OTPEntry),
		ttl:     ttl,
	}
	go m.cleanupLoop()
	return m
}

// Generate 为指定用户生成新的一次性密码，旧密码会被覆盖
func (m *OTPManager) Generate(username string) (*OTPEntry, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, errors.New("用户名不能为空")
	}

	pwd, err := randomPassword(12)
	if err != nil {
		return nil, err
	}

	entry := &OTPEntry{
		Username:  username,
		Password:  pwd,
		ExpiresAt: time.Now().Add(m.ttl),
	}

	m.mu.Lock()
	m.entries[username] = entry
	m.mu.Unlock()

	return entry, nil
}

// Consume 校验并消费一次性密码，成功后立即失效
func (m *OTPManager) Consume(username, password string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.entries[username]
	if !ok {
		return ErrOTPNotFound
	}

	if time.Now().After(entry.ExpiresAt) {
		delete(m.entries, username)
		return ErrOTPExpired
	}

	if entry.Password != password {
		return ErrOTPNotFound
	}

	delete(m.entries, username)
	return nil
}

func (m *OTPManager) cleanupLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		m.mu.Lock()
		now := time.Now()
		for k, v := range m.entries {
			if now.After(v.ExpiresAt) {
				delete(m.entries, k)
			}
		}
		m.mu.Unlock()
	}
}

func randomPassword(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b)[:n*2], nil
}
