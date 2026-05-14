package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
)

// EnsureAdminToken 确保 admin token 文件存在，不存在则生成新 token 并写入文件。
// 该 token 用于本地 CLI 调用内部接口（如生成 OTP）的鉴权。
func EnsureAdminToken(path string) (string, error) {
	if data, err := os.ReadFile(path); err == nil {
		token := strings.TrimSpace(string(data))
		if token != "" {
			return token, nil
		}
	}

	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)

	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return "", err
	}
	if err := os.WriteFile(path, []byte(token), 0600); err != nil {
		return "", err
	}
	return token, nil
}

// ReadAdminToken 读取已存在的 admin token，由 CLI 子命令调用
func ReadAdminToken(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	token := strings.TrimSpace(string(data))
	if token == "" {
		return "", os.ErrNotExist
	}
	return token, nil
}

// CompareTokens 常量时间比较，避免时序攻击
func CompareTokens(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
