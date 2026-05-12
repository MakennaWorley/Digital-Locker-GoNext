package main

import (
	"digital-locker/backend/database"
	"digital-locker/backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	r := gin.Default()

	// CORS — allow the Next.js dev server and any configured production origin.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Disposition"},
		AllowCredentials: false,
	}))

	api := r.Group("/")
	{
		api.GET("/files", handlers.ListFiles)
		api.POST("/files", handlers.AddFile)
		api.DELETE("/files", handlers.DeleteFile)
		api.POST("/keys", handlers.ValidateAPIKey, handlers.GenerateKey)
		api.GET("/download/:key", handlers.DownloadFile)
	}

	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
