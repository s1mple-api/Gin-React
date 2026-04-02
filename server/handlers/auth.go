package handlers

import (
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"server/config"
	"server/middleware"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token    string        `json:"token"`
	User     *models.User  `json:"user"`
	MenuTree []interface{} `json:"menu_tree"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误"})
		return
	}

	var user models.User
	if err := config.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			LogLogin(0, req.Username, middleware.GetClientIP(c), false)
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "服务器错误"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		LogLogin(user.ID, user.Username, middleware.GetClientIP(c), false)
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
		return
	}

	if !user.Status {
		LogLogin(user.ID, user.Username, middleware.GetClientIP(c), false)
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "账号已被禁用"})
		return
	}

	config.DB.First(&user.Role, user.RoleID)

	token, err := utils.GenerateToken(user.ID, user.Username, user.RoleID, config.AppConfig.JWTSecret, 24*7*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成Token失败"})
		return
	}

	middleware.StoreToken(user.ID, token)

	var menus []models.Menu
	config.DB.Where("status = ?", true).Order("sort ASC").Find(&menus)
	menuTree := BuildMenuTree(menus)

	LogLogin(user.ID, user.Username, middleware.GetClientIP(c), true)

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "登录成功",
		"data": LoginResponse{
			Token:    token,
			User:     &user,
			MenuTree: menuTree,
		},
	})
}

func Logout(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")
	token := c.GetString("token")

	middleware.RemoveToken(token)
	LogLogout(userID, username, middleware.GetClientIP(c))

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "退出登录成功"})
}
