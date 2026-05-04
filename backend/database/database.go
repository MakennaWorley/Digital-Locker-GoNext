package database

import (
	"log"

	"digital-locker/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global database handle.
var DB *gorm.DB

// Init opens the SQLite database file and auto-migrates the schema.
func Init() {
	var err error

	DB, err = gorm.Open(sqlite.Open("locker.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("database: failed to connect: %v", err)
	}

	if err = DB.AutoMigrate(&models.File{}, &models.Key{}); err != nil {
		log.Fatalf("database: failed to migrate schema: %v", err)
	}

	log.Println("database: initialised (locker.db)")
}
