package store

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"time"
)

var (
	ErrDataNotFound = errors.New("用户数据不存在")
)

// SyncMeta 同步元数据（版本号+最后修改时间）
type SyncMeta struct {
	Version        int       `json:"version"`
	LastModifiedAt time.Time `json:"last_modified_at"`
}

// FileStore 文件存储
type FileStore struct {
	basePath string
}

// NewFileStore 创建文件存储实例
func NewFileStore(basePath string) *FileStore {
	return &FileStore{basePath: basePath}
}

// getUserDataPath 获取用户数据文件路径
func (f *FileStore) getUserDataPath(username string) string {
	// 使用用户名作为文件名，确保安全（只允许字母数字下划线）
	safeName := sanitizeFilename(username)
	return filepath.Join(f.basePath, safeName+".json")
}

// sanitizeFilename 安全化文件名
func sanitizeFilename(name string) string {
	result := make([]rune, 0, len(name))
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') || r == '_' || r == '-' ||
			(r >= '\u4e00' && r <= '\u9fff') { // 允许中文字符
			result = append(result, r)
		} else {
			result = append(result, '_')
		}
	}
	return string(result)
}

// SaveUserData 保存用户数据
func (f *FileStore) SaveUserData(username string, data interface{}) error {
	filePath := f.getUserDataPath(username)

	// 序列化数据
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	// 写入文件
	return os.WriteFile(filePath, jsonData, 0644)
}

// LoadUserData 加载用户数据
func (f *FileStore) LoadUserData(username string) (map[string]interface{}, error) {
	filePath := f.getUserDataPath(username)

	// 读取文件
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrDataNotFound
		}
		return nil, err
	}

	// 解析JSON
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// UserDataExists 检查用户数据是否存在
func (f *FileStore) UserDataExists(username string) bool {
	filePath := f.getUserDataPath(username)
	_, err := os.Stat(filePath)
	return err == nil
}

// DeleteUserData 删除用户数据
func (f *FileStore) DeleteUserData(username string) error {
	filePath := f.getUserDataPath(username)
	err := os.Remove(filePath)
	if os.IsNotExist(err) {
		return nil // 文件不存在也算删除成功
	}
	return err
}

// GetUserDataInfo 获取用户数据信息（文件大小、修改时间等）
func (f *FileStore) GetUserDataInfo(username string) (map[string]interface{}, error) {
	filePath := f.getUserDataPath(username)

	info, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrDataNotFound
		}
		return nil, err
	}

	return map[string]interface{}{
		"size":      info.Size(),
		"modified":  info.ModTime(),
		"file_path": filePath,
	}, nil
}

// getMetaPath 获取用户同步元数据文件路径
func (f *FileStore) getMetaPath(username string) string {
	safeName := sanitizeFilename(username)
	return filepath.Join(f.basePath, safeName+".meta.json")
}

// LoadSyncMeta 读取用户同步元数据
func (f *FileStore) LoadSyncMeta(username string) (*SyncMeta, error) {
	metaPath := f.getMetaPath(username)

	data, err := os.ReadFile(metaPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &SyncMeta{Version: 0}, nil
		}
		return nil, err
	}

	var meta SyncMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return &SyncMeta{Version: 0}, nil
	}
	return &meta, nil
}

// IncrementSyncVersion 递增版本号并保存
func (f *FileStore) IncrementSyncVersion(username string) (*SyncMeta, error) {
	current, err := f.LoadSyncMeta(username)
	if err != nil {
		current = &SyncMeta{Version: 0}
	}

	current.Version++
	current.LastModifiedAt = time.Now()

	data, err := json.MarshalIndent(current, "", "  ")
	if err != nil {
		return nil, err
	}

	if err := os.WriteFile(f.getMetaPath(username), data, 0644); err != nil {
		return nil, err
	}
	return current, nil
}
