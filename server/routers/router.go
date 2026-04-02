package routers

import (
	"server/config"
	"server/handlers"
	"server/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())
	r.Use(middleware.ResponseInterceptor())

	r.POST("/api/login", handlers.Login)

	api := r.Group("/api")
	api.Use(middleware.JWTAuth(config.AppConfig.JWTSecret))
	{
		api.POST("/logout", handlers.Logout)

		api.GET("/menu/list", handlers.GetMenus)
		api.GET("/menu/all", handlers.GetAllMenus)
		api.POST("/menu", handlers.CreateMenu)
		api.PUT("/menu/:id", handlers.UpdateMenu)
		api.DELETE("/menu/:id", handlers.DeleteMenu)

		api.GET("/role/list", handlers.GetRoles)
		api.POST("/role", handlers.CreateRole)
		api.PUT("/role/:id", handlers.UpdateRole)
		api.DELETE("/role/:id", handlers.DeleteRole)

		api.GET("/user/list", handlers.GetUsers)
		api.POST("/user", handlers.CreateUser)
		api.PUT("/user/:id", handlers.UpdateUser)
		api.DELETE("/user/:id", handlers.DeleteUser)
		api.GET("/user/info", handlers.GetUserInfo)
		api.POST("/user/password", handlers.ChangePassword)

		api.GET("/log/list", handlers.GetLogs)
		api.GET("/log/stats", handlers.GetLogStats)
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
