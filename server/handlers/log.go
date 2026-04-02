package handlers

import (
	"net/http"
	"strconv"
	"time"

	"server/config"
	"server/models"

	"github.com/gin-gonic/gin"
)

type LogResponse struct {
	ID       uint      `json:"id"`
	UserID   uint      `json:"user_id"`
	Username string    `json:"username"`
	Action   string    `json:"action"`
	Method   string    `json:"method"`
	Path     string    `json:"path"`
	IP       string    `json:"ip"`
	Status   int       `json:"status"`
	Message  string    `json:"message"`
	User     *models.User `json:"user,omitempty"`
}

func GetLogs(c *gin.Context) {
	var logs []models.Log
	query := config.DB.Preload("User").Order("created_at DESC")

	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}
	if username := c.Query("username"); username != "" {
		query = query.Where("username LIKE ?", "%"+username+"%")
	}
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	var total int64
	query.Model(&models.Log{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取日志失败"})
		return
	}

	var logResponses []LogResponse
	for _, log := range logs {
		logResponses = append(logResponses, LogResponse{
			ID:       log.ID,
			UserID:   log.UserID,
			Username: log.Username,
			Action:   log.Action,
			Method:   log.Method,
			Path:     log.Path,
			IP:       log.IP,
			Status:   log.Status,
			Message:  log.Message,
			User:     log.User,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"message": "success",
		"data": gin.H{
			"list": logResponses,
			"total": total,
			"page": page,
			"pageSize": pageSize,
		},
	})
}

func CreateLog(userID uint, username, action, method, path, ip string, status int, message string) {
	log := models.Log{
		UserID:   userID,
		Username: username,
		Action:   action,
		Method:   method,
		Path:     path,
		IP:       ip,
		Status:   status,
		Message:  message,
	}
	config.DB.Create(&log)
}

func LogLogin(userID uint, username, ip string, success bool) {
	status := 200
	message := "登录成功"
	if !success {
		status = 401
		message = "登录失败"
	}
	CreateLog(userID, username, "登录", "POST", "/api/login", ip, status, message)
}

func LogLogout(userID uint, username, ip string) {
	CreateLog(userID, username, "登出", "POST", "/api/logout", ip, 200, "退出登录")
}

func LogOperation(userID uint, username, action, method, path, ip string, success bool) {
	status := 200
	message := action + "成功"
	if !success {
		status = 400
		message = action + "失败"
	}
	CreateLog(userID, username, action, method, path, ip, status, message)
}

func GetLogStats(c *gin.Context) {
	var stats struct {
		TodayLogins    int64 `json:"today_logins"`
		TodayLogouts   int64 `json:"today_logouts"`
		TodayOperations int64 `json:"today_operations"`
		TotalLogs      int64 `json:"total_logs"`
	}

	today := time.Now().Format("2006-01-02")

	config.DB.Model(&models.Log{}).Where("action = ? AND created_at >= ?", "登录", today+" 00:00:00").Count(&stats.TodayLogins)
	config.DB.Model(&models.Log{}).Where("action = ? AND created_at >= ?", "登出", today+" 00:00:00").Count(&stats.TodayLogouts)
	config.DB.Model(&models.Log{}).Where("action NOT IN (?, ?) AND created_at >= ?", "登录", "登出", today+" 00:00:00").Count(&stats.TodayOperations)
	config.DB.Model(&models.Log{}).Count(&stats.TotalLogs)

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": stats})
}
