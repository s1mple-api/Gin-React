package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Role{},
		&Menu{},
		&Log{},
	)
}

func SeedData(db *gorm.DB) error {
	var count int64
	db.Model(&User{}).Count(&count)
	if count > 0 {
		return nil
	}

	menus := []Menu{
		{Name: "系统管理", Path: "/system", Icon: "SettingOutlined", Sort: 1, Status: true, Children: nil},
		{Name: "菜单管理", Path: "/menu-management", Icon: "MenuOutlined", Sort: 1, Status: true, ParentID: nil},
		{Name: "角色管理", Path: "/role-management", Icon: "TeamOutlined", Sort: 2, Status: true, ParentID: nil},
		{Name: "用户管理", Path: "/user-management", Icon: "UserOutlined", Sort: 3, Status: true, ParentID: nil},
		{Name: "日志管理", Path: "/log-management", Icon: "FileTextOutlined", Sort: 4, Status: true, ParentID: nil},
	}

	var systemMenu Menu
	if err := db.Where("name = ?", "系统管理").First(&systemMenu).Error; err == nil {
		db.Model(&systemMenu).Updates(map[string]interface{}{"parent_id": nil})
	}

	for i := range menus {
		if menus[i].Name == "系统管理" {
			continue
		}
		db.Create(&menus[i])
	}

	menus[0].Children = []*Menu{&menus[1], &menus[2], &menus[3], &menus[4]}
	for i := range menus {
		if menus[i].Name != "系统管理" {
			db.Model(&menus[i]).Updates(map[string]interface{}{"parent_id": menus[0].ID})
		}
	}

	adminRole := Role{
		Name:        "超级管理员",
		Code:        "super_admin",
		Description: "拥有所有权限",
		Status:      true,
	}
	db.Create(&adminRole)

	userRole := Role{
		Name:        "普通用户",
		Code:        "user",
		Description: "普通用户权限",
		Status:      true,
	}
	db.Create(&userRole)

	guestRole := Role{
		Name:        "访客",
		Code:        "guest",
		Description: "只读权限",
		Status:      false,
	}
	db.Create(&guestRole)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	users := []User{
		{Username: "admin", Password: string(hashedPassword), Name: "管理员", Email: "admin@example.com", Phone: "13800138000", Status: true, RoleID: adminRole.ID},
		{Username: "user1", Password: string(hashedPassword), Name: "张三", Email: "zhangsan@example.com", Phone: "13800138001", Status: true, RoleID: userRole.ID},
		{Username: "user2", Password: string(hashedPassword), Name: "李四", Email: "lisi@example.com", Phone: "13800138002", Status: false, RoleID: userRole.ID},
	}

	for _, user := range users {
		db.Create(&user)
	}

	var allMenus []Menu
	db.Find(&allMenus)
	db.Model(&adminRole).Association("Menus").Append(&allMenus)

	return nil
}
