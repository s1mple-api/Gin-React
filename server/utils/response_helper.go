package utils

import (
	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code:    CodeSuccess,
		Message: GetCodeMessage(CodeSuccess),
		Data:    data,
	})
}

func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(200, Response{
		Code:    CodeSuccess,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, code int) {
	c.JSON(code, Response{
		Code:    code,
		Message: GetStatusMessage(code),
	})
}

func ErrorWithMessage(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
	})
}

func ErrorWithCustomCode(c *gin.Context, code int, message string) {
	c.JSON(200, Response{
		Code:    code,
		Message: message,
	})
}

func BadRequest(c *gin.Context, message string) {
	ErrorWithCustomCode(c, CodeBadRequest, message)
}

func Unauthorized(c *gin.Context, message string) {
	ErrorWithCustomCode(c, CodeUnauthorized, message)
}

func Forbidden(c *gin.Context, message string) {
	ErrorWithCustomCode(c, CodeForbidden, message)
}

func NotFound(c *gin.Context, message string) {
	ErrorWithCustomCode(c, CodeNotFound, message)
}

func InternalServerError(c *gin.Context, message string) {
	ErrorWithCustomCode(c, CodeInternalServerErr, message)
}
