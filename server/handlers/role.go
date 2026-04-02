package handlers

import (
	"net/http"

	"server/config"
	"server/middleware"
	"server/models"

	"github.com/gin-gonic/gin"
)

type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Status      bool   `json:"status"`
	MenuIDs     []uint `json:"menu_ids"`
}

type UpdateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Status      bool   `json:"status"`
	MenuIDs     []uint `json:"menu_ids"`
}

func GetRoles(c *gin.Context) {
	var roles []models.Role
	if err := config.DB.Preload("Menus").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取角色失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": roles})
}

func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var existRole models.Role
	if err := config.DB.Where("code = ?", req.Code).First(&existRole).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "角色编码已存在"})
		return
	}

	role := models.Role{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      req.Status,
	}

	if err := config.DB.Create(&role).Error; err != nil {
		LogOperation(userID, username, "创建角色", "POST", "/api/role", middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建角色失败"})
		return
	}

	if len(req.MenuIDs) > 0 {
		var menus []models.Menu
		config.DB.Find(&menus, req.MenuIDs)
		config.DB.Model(&role).Association("Menus").Append(&menus)
	}

	LogOperation(userID, username, "创建角色", "POST", "/api/role", middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "创建成功", "data": role})
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var role models.Role
	if err := config.DB.Preload("Menus").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var existRole models.Role
	if err := config.DB.Where("code = ? AND id != ?", req.Code, id).First(&existRole).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "角色编码已存在"})
		return
	}

	updates := map[string]interface{}{
		"name":        req.Name,
		"code":        req.Code,
		"description": req.Description,
		"status":      req.Status,
	}

	if err := config.DB.Model(&role).Updates(updates).Error; err != nil {
		LogOperation(userID, username, "更新角色", "PUT", "/api/role/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新角色失败"})
		return
	}

	config.DB.Model(&role).Association("Menus").Replace([]models.Menu{})
	if len(req.MenuIDs) > 0 {
		var menus []models.Menu
		config.DB.Find(&menus, req.MenuIDs)
		config.DB.Model(&role).Association("Menus").Append(&menus)
	}

	config.DB.Preload("Menus").First(&role, id)
	LogOperation(userID, username, "更新角色", "PUT", "/api/role/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "更新成功", "data": role})
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := config.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var userCount int64
	config.DB.Model(&models.User{}).Where("role_id = ?", id).Count(&userCount)
	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该角色下存在用户，无法删除"})
		return
	}

	if err := config.DB.Delete(&role).Error; err != nil {
		LogOperation(userID, username, "删除角色", "DELETE", "/api/role/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除角色失败"})
		return
	}

	LogOperation(userID, username, "删除角色", "DELETE", "/api/role/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "删除成功"})
}
