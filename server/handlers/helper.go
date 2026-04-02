package handlers

import "server/models"

func BuildMenuTree(menus []models.Menu) []interface{} {
	menuMap := make(map[uint]*models.Menu)
	var rootMenus []interface{}

	for i := range menus {
		menuMap[menus[i].ID] = &menus[i]
	}

	for i := range menus {
		menu := &menus[i]
		if menu.ParentID == nil || *menu.ParentID == 0 {
			rootMenus = append(rootMenus, map[string]interface{}{
				"id":        menu.ID,
				"name":      menu.Name,
				"path":      menu.Path,
				"icon":      menu.Icon,
				"parent_id": menu.ParentID,
				"sort":      menu.Sort,
				"status":    menu.Status,
				"children":  getChildren(menu.ID, menuMap),
			})
		}
	}

	return rootMenus
}

func getChildren(parentID uint, menuMap map[uint]*models.Menu) []interface{} {
	var children []interface{}
	for _, menu := range menuMap {
		if menu.ParentID != nil && *menu.ParentID == parentID {
			children = append(children, map[string]interface{}{
				"id":        menu.ID,
				"name":      menu.Name,
				"path":      menu.Path,
				"icon":      menu.Icon,
				"parent_id": menu.ParentID,
				"sort":      menu.Sort,
				"status":    menu.Status,
				"children":  getChildren(menu.ID, menuMap),
			})
		}
	}
	return children
}
