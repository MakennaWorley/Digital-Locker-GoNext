package models

import "time"

// File represents a registered asset in the vault.
type File struct {
	ID        uint   `json:"id"         gorm:"primaryKey;autoIncrement"`
	Name      string `json:"name"       gorm:"not null"`
	LocalPath string `json:"local_path" gorm:"not null"`
}

// Key represents a time-limited UUID access key tied to a File.
type Key struct {
	ID        uint      `json:"id"         gorm:"primaryKey;autoIncrement"`
	AccessKey string    `json:"access_key" gorm:"uniqueIndex;not null"`
	FileID    uint      `json:"file_id"    gorm:"not null"`
	UseCount  int       `json:"use_count"  gorm:"default:0"`
	MaxUses   int       `json:"max_uses"   gorm:"default:0"`
	ExpiresAt time.Time `json:"expires_at"`
}
