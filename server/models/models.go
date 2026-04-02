package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
	Username  string         `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Name      string         `gorm:"size:100" json:"name"`
	Email     string         `gorm:"size:100" json:"email"`
	Phone     string         `gorm:"size:20" json:"phone"`
	Avatar    string         `gorm:"size:255" json:"avatar"`
	Status    bool          `gorm:"default:true" json:"status"`
	RoleID    uint           `json:"role_id"`
	Role      *Role         `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

func (User) TableName() string {
	return "users"
}

type Role struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at"`
	Name        string         `gorm:"size:50;uniqueIndex;not null" json:"name"`
	Code        string         `gorm:"size:50;uniqueIndex;not null" json:"code"`
	Description string         `gorm:"size:255" json:"description"`
	Status      bool           `gorm:"default:true" json:"status"`
	Menus       []*Menu        `gorm:"many2many:role_menus;" json:"menus"`
}

func (Role) TableName() string {
	return "roles"
}

type Menu struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
	Name      string         `gorm:"size:50;not null" json:"name"`
	Path      string         `gorm:"size:255;not null" json:"path"`
	Icon      string         `gorm:"size:50" json:"icon"`
	ParentID  *uint          `json:"parent_id"`
	Sort      int            `gorm:"default:0" json:"sort"`
	Status    bool           `gorm:"default:true" json:"status"`
	Children  []*Menu        `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (Menu) TableName() string {
	return "menus"
}

type Log struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UserID    uint           `json:"user_id"`
	Username  string         `gorm:"size:50;not null" json:"username"`
	Action    string         `gorm:"size:50;not null" json:"action"`
	Method    string         `gorm:"size:10;not null" json:"method"`
	Path      string         `gorm:"size:255" json:"path"`
	IP        string         `gorm:"size:50" json:"ip"`
	Status    int           `gorm:"default:200" json:"status"`
	Message   string         `gorm:"size:500" json:"message"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Log) TableName() string {
	return "logs"
}
