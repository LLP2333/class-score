package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Config 应用配置
type Config struct {
	Server  ServerConfig  `yaml:"server"`
	Storage StorageConfig `yaml:"storage"`
	JWT     JWTConfig     `yaml:"jwt"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port           int      `yaml:"port"`
	AllowedOrigins []string `yaml:"allowed_origins"`
}

// StorageConfig 存储配置
type StorageConfig struct {
	DataDir     string `yaml:"data_dir"`
	DBFile      string `yaml:"db_file"`
	UserdataDir string `yaml:"userdata_dir"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret      string `yaml:"secret"`
	ExpireHours int    `yaml:"expire_hours"`
}

// Load 加载配置文件
func Load(configPath string) (*Config, error) {
	// 默认配置
	cfg := &Config{
		Server: ServerConfig{
			Port:           8000,
			AllowedOrigins: []string{"http://127.0.0.1", "http://localhost", "file://"},
		},
		Storage: StorageConfig{
			DataDir:     "./data",
			DBFile:      "users.db",
			UserdataDir: "userdata",
		},
		JWT: JWTConfig{
			Secret:      "class-score-secret-key",
			ExpireHours: 24,
		},
	}

	// 尝试读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		// 配置文件不存在时使用默认配置
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}

	// 解析YAML
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

// GetDBPath 获取数据库完整路径
func (c *Config) GetDBPath() string {
	return filepath.Join(c.Storage.DataDir, c.Storage.DBFile)
}

// GetUserdataPath 获取用户数据目录完整路径
func (c *Config) GetUserdataPath() string {
	return filepath.Join(c.Storage.DataDir, c.Storage.UserdataDir)
}

// EnsureDataDirs 确保数据目录存在
func (c *Config) EnsureDataDirs() error {
	// 创建数据根目录
	if err := os.MkdirAll(c.Storage.DataDir, 0755); err != nil {
		return err
	}
	// 创建用户数据目录
	if err := os.MkdirAll(c.GetUserdataPath(), 0755); err != nil {
		return err
	}
	return nil
}
