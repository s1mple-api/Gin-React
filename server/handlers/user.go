package handlers

import (
	"net/http"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"server/config"
	"server/middleware"
	"server/models"

	"github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	RoleID   uint   `json:"role_id" binding:"required"`
	Status   bool   `json:"status"`
}

type UpdateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	RoleID   uint   `json:"role_id" binding:"required"`
	Status   bool   `json:"status"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func GetUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Preload("Role").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取用户失败"})
		return
	}

	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": users})
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var existUser models.User
	if err := config.DB.Where("username = ?", req.Username).First(&existUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "用户名已存在"})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	user := models.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		RoleID:   req.RoleID,
		Status:   req.Status,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		LogOperation(userID, username, "创建用户", "POST", "/api/user", middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建用户失败"})
		return
	}

	user.Password = ""
	config.DB.First(&user.Role, user.RoleID)
	LogOperation(userID, username, "创建用户", "POST", "/api/user", middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "创建成功", "data": user})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.Preload("Role").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var existUser models.User
	if err := config.DB.Where("username = ? AND id != ?", req.Username, id).First(&existUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "用户名已存在"})
		return
	}

	updates := map[string]interface{}{
		"name":    req.Name,
		"email":   req.Email,
		"phone":   req.Phone,
		"role_id": req.RoleID,
		"status":  req.Status,
	}

	if err := config.DB.Model(&user).Updates(updates).Error; err != nil {
		LogOperation(userID, username, "更新用户", "PUT", "/api/user/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新用户失败"})
		return
	}

	config.DB.Preload("Role").First(&user, id)
	user.Password = ""
	LogOperation(userID, username, "更新用户", "PUT", "/api/user/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "更新成功", "data": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	if err := config.DB.Delete(&user).Error; err != nil {
		LogOperation(userID, username, "删除用户", "DELETE", "/api/user/"+id, middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除用户失败"})
		return
	}

	LogOperation(userID, username, "删除用户", "DELETE", "/api/user/"+id, middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "删除成功"})
}

func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		LogOperation(userID, username, "修改密码", "POST", "/api/user/password", middleware.GetClientIP(c), false)
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "原密码错误"})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)

	if err := config.DB.Model(&user).Update("password", string(hashedPassword)).Error; err != nil {
		LogOperation(userID, username, "修改密码", "POST", "/api/user/password", middleware.GetClientIP(c), false)
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "修改密码失败"})
		return
	}

	LogOperation(userID, username, "修改密码", "POST", "/api/user/password", middleware.GetClientIP(c), true)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "修改密码成功"})
}

func GetUserInfo(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := config.DB.Preload("Role").First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取用户信息失败"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": user})
}
