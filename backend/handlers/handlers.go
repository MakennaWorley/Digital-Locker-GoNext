package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"digital-locker/backend/database"
	"digital-locker/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var APIKey = os.Getenv("DIGITAL_LOCKER_API_KEY")

// ValidateAPIKey is middleware to check the X-API-Key header.
func ValidateAPIKey(c *gin.Context) {
	if APIKey == "" {
		log.Println("handlers: warning – DIGITAL_LOCKER_API_KEY not set, skipping validation")
		c.Next()
		return
	}

	key := c.GetHeader("X-API-Key")
	if key != APIKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid api key"})
		c.Abort()
		return
	}
	c.Next()
}

// ListFiles returns all registered vault assets as JSON.
func ListFiles(c *gin.Context) {
	var files []models.File
	database.DB.Find(&files)
	c.JSON(http.StatusOK, files)
}

// AddFile registers a new local file path in the vault.
func AddFile(c *gin.Context) {
	var payload struct {
		Name      string `json:"name"       binding:"required"`
		LocalPath string `json:"local_path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	file := models.File{
		Name:      payload.Name,
		LocalPath: filepath.Clean(payload.LocalPath),
	}

	if err := database.DB.Create(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register file"})
		return
	}

	c.JSON(http.StatusCreated, file)
}

// GenerateKey creates a new UUID access key for a given file ID.
// If expires_at is omitted, the key expires in 24 hours.
// If max_uses is omitted or 0, the key has unlimited uses.
func GenerateKey(c *gin.Context) {
	var payload struct {
		FileID    uint      `json:"file_id"    binding:"required"`
		MaxUses   int       `json:"max_uses"`
		ExpiresAt time.Time `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var file models.File
	if err := database.DB.First(&file, payload.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	expiresAt := payload.ExpiresAt
	if expiresAt.IsZero() {
		expiresAt = time.Now().Add(24 * time.Hour)
	}

	key := models.Key{
		AccessKey: uuid.New().String(),
		FileID:    payload.FileID,
		MaxUses:   payload.MaxUses,
		ExpiresAt: expiresAt,
	}

	if err := database.DB.Create(&key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create key"})
		return
	}

	c.JSON(http.StatusCreated, key)
}

// DeleteFile removes a registered file from the vault.
func DeleteFile(c *gin.Context) {
	var payload struct {
		FileID uint `json:"file_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var file models.File
	if err := database.DB.First(&file, payload.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	// Delete all associated keys first
	if err := database.DB.Where("file_id = ?", payload.FileID).Delete(&models.Key{}).Error; err != nil {
		log.Printf("handlers: warning – could not delete keys for file %d: %v", payload.FileID, err)
	}

	// Delete the file record
	if err := database.DB.Delete(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "file deleted"})
}

// DownloadFile validates the access key, checks expiry and use limits,
// increments its use counter, and streams the file from local disk using io.Copy.
func DownloadFile(c *gin.Context) {
	keyStr := c.Param("key")

	var key models.Key
	if err := database.DB.Where("access_key = ?", keyStr).First(&key).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid key"})
		return
	}

	// Check if key has expired
	if time.Now().After(key.ExpiresAt) {
		c.JSON(http.StatusForbidden, gin.H{"error": "key has expired"})
		return
	}

	// Check if max uses has been reached (0 = unlimited)
	if key.MaxUses > 0 && key.UseCount >= key.MaxUses {
		c.JSON(http.StatusForbidden, gin.H{"error": "download limit reached"})
		return
	}

	var file models.File
	if err := database.DB.First(&file, key.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	// Atomically increment the use counter before serving.
	if err := database.DB.Model(&key).
		UpdateColumn("use_count", gorm.Expr("use_count + ?", 1)).Error; err != nil {
		log.Printf("handlers: warning – could not increment use_count for key %d: %v", key.ID, err)
	}

	f, err := os.Open(file.LocalPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open file"})
		return
	}
	defer f.Close()

	fileName := filepath.Base(file.LocalPath)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	c.Header("Content-Type", "application/octet-stream")

	if _, err = io.Copy(c.Writer, f); err != nil {
		log.Printf("handlers: error streaming %q: %v", file.LocalPath, err)
	}
}
