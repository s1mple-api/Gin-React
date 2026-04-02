package utils

const (
	CodeSuccess           = 200
	CodeBadRequest        = 400
	CodeUnauthorized      = 401
	CodeForbidden         = 403
	CodeNotFound          = 404
	CodeInternalServerErr = 500
)

var StatusMessages = map[int]string{
	CodeSuccess:           "success",
	CodeBadRequest:        "请求参数错误",
	CodeUnauthorized:      "未授权，请登录",
	CodeForbidden:         "禁止访问",
	CodeNotFound:          "资源不存在",
	CodeInternalServerErr: "服务器内部错误",
}

var CodeMessages = map[int]string{
	200: "操作成功",
	400: "请求参数错误",
	401: "用户名或密码错误",
	403: "禁止访问",
	404: "资源不存在",
	500: "服务器错误",
}

func GetStatusMessage(code int) string {
	if msg, ok := StatusMessages[code]; ok {
		return msg
	}
	return "未知错误"
}

func GetCodeMessage(code int) string {
	if msg, ok := CodeMessages[code]; ok {
		return msg
	}
	return "操作失败"
}
