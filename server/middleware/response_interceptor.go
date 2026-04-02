package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"time"

	"server/utils"

	"github.com/gin-gonic/gin"
)

type ResponseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r *ResponseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

func ResponseInterceptor() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		body, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

		c.Set("request_body", string(body))

		responseBody := &bytes.Buffer{}
		writer := &ResponseBodyWriter{
			ResponseWriter: c.Writer,
			body:           responseBody,
		}
		c.Writer = writer

		c.Next()

		endTime := time.Now()
		latency := endTime.Sub(startTime)

		path := c.Request.URL.Path
		method := c.Request.Method
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()

		if path == "/api/login" || path == "/api/logout" {
			return
		}

		var response utils.Response
		if err := json.Unmarshal(responseBody.Bytes(), &response); err == nil {
			if response.Code != 200 && response.Code != 0 {
				logRequest(c, method, path, clientIP, statusCode, int(latency.Milliseconds()), response.Code, response.Message)
			}
		} else {
			logRequest(c, method, path, clientIP, statusCode, int(latency.Milliseconds()), statusCode, "响应解析失败")
		}
	}
}

func logRequest(c *gin.Context, method, path, ip string, status, latencyStatus int, code int, message string) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	if uid, ok := userID.(uint); ok {
		LogOperationToDB(uid, username.(string), method, path, ip, code, message)
	}
}

func LogOperationToDB(userID uint, username, method, path, ip string, status int, message string) {
	log := map[string]interface{}{
		"user_id":  userID,
		"username": username,
		"method":   method,
		"path":     path,
		"ip":       ip,
		"status":   status,
		"message":  message,
	}

	_ = log
}
