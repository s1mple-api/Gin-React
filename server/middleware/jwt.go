package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"server/utils"
)

type TokenManager struct {
	mu      sync.RWMutex
	tokens  map[string]time.Time
	userTokens map[uint]string
}

var manager = &TokenManager{
	tokens:      make(map[string]time.Time),
	userTokens: make(map[uint]string),
}

func ValidateToken(tokenString string, secret string) (bool, uint, string) {
	manager.mu.RLock()
	storedToken, exists := manager.userTokens[0]
	manager.mu.RUnlock()

	if exists && storedToken != tokenString {
		return false, 0, ""
	}

	claims, err := utils.ParseToken(tokenString, secret)
	if err != nil {
		return false, 0, ""
	}

	return true, claims.UserID, claims.Username
}

func StoreToken(userID uint, token string) {
	manager.mu.Lock()
	manager.tokens[token] = time.Now()
	manager.userTokens[userID] = token
	manager.mu.Unlock()
}

func RemoveUserToken(userID uint) {
	manager.mu.Lock()
	if token, exists := manager.userTokens[userID]; exists {
		delete(manager.tokens, token)
	}
	delete(manager.userTokens, userID)
	manager.mu.Unlock()
}

func RemoveToken(token string) {
	manager.mu.Lock()
	if userID, exists := findUserByToken(token); exists {
		delete(manager.userTokens, userID)
	}
	delete(manager.tokens, token)
	manager.mu.Unlock()
}

func findUserByToken(token string) (uint, bool) {
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	for userID, t := range manager.userTokens {
		if t == token {
			return userID, true
		}
	}
	return 0, false
}

func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "请先登录"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "Token格式错误"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		valid, userID, username := ValidateToken(tokenString, secret)
		if !valid {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "Token已过期，请重新登录"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Set("username", username)
		c.Set("token", tokenString)
		c.Next()
	}
}

func GetClientIP(c *gin.Context) string {
	ip := c.ClientIP()
	if ip == "" {
		ip = "127.0.0.1"
	}
	return ip
}
