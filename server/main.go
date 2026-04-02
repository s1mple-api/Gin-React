package main

import (
	"fmt"
	"log"

	"server/config"
	"server/models"
	"server/routers"
)

func main() {
	config.InitConfig()

	if err := config.InitDB(); err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	if err := models.Migrate(config.DB); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	if err := models.SeedData(config.DB); err != nil {
		log.Fatalf("初始化数据失败: %v", err)
	}

	r := routers.SetupRouter()

	addr := fmt.Sprintf(":%s", config.AppConfig.ServerPort)
	log.Printf("服务器启动成功，监听地址: %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
