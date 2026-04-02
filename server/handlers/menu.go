package handlers

import (
	"net/http"

	"server/config"
	"server/middleware"
	"server/models"

	"github.com/gin-gonic/gin"
)

type CreateMenuRequest struct {
	Name     string `json:"name" binding:"required"`
	Path     string `json:"path" binding:"required"`
	Icon     string `json:"icon"`
	ParentID *uint  `json:"parent_id"`
	Sort     int    `json:"sort"`
	Status   bool   `json:"status"`
}

type UpdateMenuRequest struct {
	Name     string `json:"name" binding:"required"`
	Path     string `json:"path" binding:"required"`
	Icon     string `json:"icon"`
	ParentID *uint  `json:"parent_id"`
	Sort     int    `json:"sort"`
	Status   bool   `json:"status"`
}

func GetMenus(c *gin.Context) {
	var menus []models.Menu
	if err := config.DB.Where("status = ?", true).Order("sort ASC").Find(&menus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取菜单失败"})
		return
	}

	menuTree := BuildMenuTree(menus)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": menuTree})
}

func GetAllMenus(c *gin.Context) {
	var menus []models.Menu
	if err := config.DB.Order("sort ASC").Find(&menus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取菜单失败"})
		return
	}

	menuTree := BuildMenuTree(menus)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": menuTree})
}

func CreateMenu(c *gin.Context) {
	var req CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	menu := models.Menu{
		Name:     req.Name,
		Path:     req.Path,
		Icon:     req.Icon,
		ParentID: req.ParentID,
		Sort:     req.Sort,
		Status:   req.Status,
	}

	if err := config.DB.Create(&menu).Error; err != nil {
		LogOperation(userID, username, "创建菜单", "POST", "/api/menu", middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建菜单失败"})
		return
	}

	LogOperation(userID, username, "创建菜单", "POST", "/api/menu", middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "创建成功", "data": menu})
}

func UpdateMenu(c *gin.Context) {
	id := c.Param("id")
	var menu models.Menu
	if err := config.DB.First(&menu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "菜单不存在"})
		return
	}

	var req UpdateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	updates := map[string]interface{}{
		"name":      req.Name,
		"path":      req.Path,
		"icon":      req.Icon,
		"parent_id": req.ParentID,
		"sort":      req.Sort,
		"status":    req.Status,
	}

	if err := config.DB.Model(&menu).Updates(updates).Error; err != nil {
		LogOperation(userID, username, "更新菜单", "PUT", "/api/menu/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新菜单失败"})
		return
	}

	LogOperation(userID, username, "更新菜单", "PUT", "/api/menu/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "更新成功", "data": menu})
}

func DeleteMenu(c *gin.Context) {
	id := c.Param("id")

	var menu models.Menu
	if err := config.DB.First(&menu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "菜单不存在"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var childrenCount int64
	config.DB.Model(&models.Menu{}).Where("parent_id = ?", id).Count(&childrenCount)
	if childrenCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请先删除子菜单"})
		return
	}

	if err := config.DB.Delete(&menu).Error; err != nil {
		LogOperation(userID, username, "删除菜单", "DELETE", "/api/menu/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除菜单失败"})
		return
	}

	LogOperation(userID, username, "删除菜单", "DELETE", "/api/menu/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "删除成功"})
}
