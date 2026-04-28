package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type MigrateResult struct {
	ClassID         int64            `json:"class_id"`
	StudentCount    int              `json:"student_count"`
	GroupCount      int              `json:"group_count"`
	RuleCount       int              `json:"rule_count"`
	RecordCount     int              `json:"record_count"`
	ProductCount    int              `json:"product_count"`
	ExchangeCount   int              `json:"exchange_count"`
	PetSpeciesCount int              `json:"pet_species_count"`
	StudentAccounts map[string]string `json:"student_accounts"` // name -> username
}

func (s *SQLiteStore) MigrateFromJSON(teacherID int64, data map[string]interface{}) (*MigrateResult, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result := &MigrateResult{
		StudentAccounts: make(map[string]string),
	}

	// 1. Create class
	className := "我的班级"
	teacherName := "班主任"
	if ci, ok := data["classInfo"].(map[string]interface{}); ok {
		if n, ok := ci["name"].(string); ok && n != "" {
			className = n
		}
		if t, ok := ci["teacher"].(string); ok && t != "" {
			teacherName = t
		}
	}

	classResult, err := tx.Exec(
		"INSERT INTO classes (name, teacher_name, teacher_id) VALUES (?, ?, ?)",
		className, teacherName, teacherID,
	)
	if err != nil {
		return nil, fmt.Errorf("创建班级失败: %w", err)
	}
	classID, _ := classResult.LastInsertId()
	result.ClassID = classID

	// ID mappings: old string ID -> new int64 ID
	groupMap := make(map[string]int64)
	studentMap := make(map[string]int64)
	ruleMap := make(map[string]int64)
	productMap := make(map[string]int64)

	// 2. Import groups
	if groups, ok := data["groups"].([]interface{}); ok {
		for _, g := range groups {
			gm, ok := g.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(gm, "id")
			name := getString(gm, "name")
			color := getInt(gm, "color", 1)

			r, err := tx.Exec(
				"INSERT INTO groups (name, color, class_id) VALUES (?, ?, ?)",
				name, color, classID,
			)
			if err != nil {
				return nil, fmt.Errorf("导入小组失败: %w", err)
			}
			newID, _ := r.LastInsertId()
			groupMap[oldID] = newID
			result.GroupCount++
		}
	}

	// 3. Import students
	if students, ok := data["students"].([]interface{}); ok {
		for _, s := range students {
			sm, ok := s.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(sm, "id")
			name := getString(sm, "name")
			avatar := getInt(sm, "avatar", 1)
			totalScore := getInt(sm, "totalScore", 0)

			var groupID *int64
			if oldGID := getString(sm, "groupId"); oldGID != "" {
				if newGID, ok := groupMap[oldGID]; ok {
					groupID = &newGID
				}
			}

			username := StudentUsername(classID, name)

			hash, err := HashPassword("123456")
			if err != nil {
				return nil, err
			}

			userResult, err := tx.Exec(
				"INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'student')",
				username, hash,
			)
			if err != nil {
				return nil, fmt.Errorf("创建学生账号失败: %w", err)
			}
			userID, _ := userResult.LastInsertId()

			r, err := tx.Exec(
				"INSERT INTO students (name, avatar, class_id, group_id, user_id, total_score) VALUES (?, ?, ?, ?, ?, ?)",
				name, avatar, classID, groupID, userID, totalScore,
			)
			if err != nil {
				return nil, fmt.Errorf("导入学生失败: %w", err)
			}
			newID, _ := r.LastInsertId()
			studentMap[oldID] = newID
			result.StudentAccounts[name] = username
			result.StudentCount++
		}
	}

	// Update group leaders
	if groups, ok := data["groups"].([]interface{}); ok {
		for _, g := range groups {
			gm, ok := g.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(gm, "id")
			leaderOldID := getString(gm, "leaderId")
			if leaderOldID != "" {
				if newGroupID, ok := groupMap[oldID]; ok {
					if newLeaderID, ok := studentMap[leaderOldID]; ok {
						tx.Exec("UPDATE groups SET leader_id = ? WHERE id = ?", newLeaderID, newGroupID)
					}
				}
			}
		}
	}

	// 4. Import rules
	if rules, ok := data["rules"].([]interface{}); ok {
		for _, r := range rules {
			rm, ok := r.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(rm, "id")
			name := getString(rm, "name")
			score := getInt(rm, "score", 0)
			typ := getString(rm, "type")
			cat := getString(rm, "category")
			icon := getString(rm, "icon")
			if cat == "" {
				cat = "其他"
			}
			if icon == "" {
				icon = "📌"
			}

			res, err := tx.Exec(
				"INSERT INTO rules (name, score, type, category, icon, class_id) VALUES (?, ?, ?, ?, ?, ?)",
				name, score, typ, cat, icon, classID,
			)
			if err != nil {
				return nil, fmt.Errorf("导入规则失败: %w", err)
			}
			newID, _ := res.LastInsertId()
			ruleMap[oldID] = newID
			result.RuleCount++
		}
	}

	// 5. Import score records
	if records, ok := data["scoreRecords"].([]interface{}); ok {
		for _, r := range records {
			rm, ok := r.(map[string]interface{})
			if !ok {
				continue
			}
			oldStudentID := getString(rm, "studentId")
			newStudentID, ok := studentMap[oldStudentID]
			if !ok {
				continue
			}

			score := getInt(rm, "score", 0)
			reason := getString(rm, "reason")
			createdAt := getString(rm, "createdAt")

			var groupID *int64
			if oldGID := getString(rm, "groupId"); oldGID != "" {
				if newGID, ok := groupMap[oldGID]; ok {
					groupID = &newGID
				}
			}

			var ruleID *int64
			if oldRID := getString(rm, "ruleId"); oldRID != "" {
				if newRID, ok := ruleMap[oldRID]; ok {
					ruleID = &newRID
				}
			}

			if createdAt != "" {
				tx.Exec(
					"INSERT INTO score_records (student_id, group_id, rule_id, score, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
					newStudentID, groupID, ruleID, score, reason, createdAt,
				)
			} else {
				tx.Exec(
					"INSERT INTO score_records (student_id, group_id, rule_id, score, reason) VALUES (?, ?, ?, ?, ?)",
					newStudentID, groupID, ruleID, score, reason,
				)
			}
			result.RecordCount++
		}
	}

	// 6. Import products
	if products, ok := data["products"].([]interface{}); ok {
		for _, p := range products {
			pm, ok := p.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(pm, "id")
			name := getString(pm, "name")
			price := getInt(pm, "price", 0)
			stock := getInt(pm, "stock", 10)
			icon := getString(pm, "icon")
			exchangeCount := getInt(pm, "exchangeCount", 0)
			if icon == "" {
				icon = "🎁"
			}

			res, err := tx.Exec(
				"INSERT INTO products (name, price, stock, icon, exchange_count, class_id) VALUES (?, ?, ?, ?, ?, ?)",
				name, price, stock, icon, exchangeCount, classID,
			)
			if err != nil {
				return nil, fmt.Errorf("导入商品失败: %w", err)
			}
			newID, _ := res.LastInsertId()
			productMap[oldID] = newID
			result.ProductCount++
		}
	}

	// 7. Import exchanges
	if exchanges, ok := data["exchanges"].([]interface{}); ok {
		for _, e := range exchanges {
			em, ok := e.(map[string]interface{})
			if !ok {
				continue
			}
			oldStudentID := getString(em, "studentId")
			oldProductID := getString(em, "productId")
			newStudentID, ok1 := studentMap[oldStudentID]
			newProductID, ok2 := productMap[oldProductID]
			if !ok1 || !ok2 {
				continue
			}

			productName := getString(em, "productName")
			price := getInt(em, "price", 0)
			createdAt := getString(em, "createdAt")

			if createdAt != "" {
				tx.Exec(
					"INSERT INTO exchanges (student_id, product_id, product_name, price, created_at) VALUES (?, ?, ?, ?, ?)",
					newStudentID, newProductID, productName, price, createdAt,
				)
			} else {
				tx.Exec(
					"INSERT INTO exchanges (student_id, product_id, product_name, price) VALUES (?, ?, ?, ?)",
					newStudentID, newProductID, productName, price,
				)
			}
			result.ExchangeCount++
		}
	}

	// 8. Import roll call history
	if history, ok := data["rollCallHistory"].([]interface{}); ok {
		for _, h := range history {
			hm, ok := h.(map[string]interface{})
			if !ok {
				continue
			}
			var names []string
			if students, ok := hm["students"].([]interface{}); ok {
				for _, s := range students {
					if name, ok := s.(string); ok {
						names = append(names, name)
					}
				}
			}
			namesJSON, _ := json.Marshal(names)
			createdAt := getString(hm, "createdAt")
			if createdAt != "" {
				tx.Exec(
					"INSERT INTO roll_call_records (class_id, student_names, created_at) VALUES (?, ?, ?)",
					classID, string(namesJSON), createdAt,
				)
			} else {
				tx.Exec(
					"INSERT INTO roll_call_records (class_id, student_names) VALUES (?, ?)",
					classID, string(namesJSON),
				)
			}
		}
	}

	// 9. Import settings
	if settings, ok := data["settings"].(map[string]interface{}); ok {
		theme := "light"
		if t, ok := settings["theme"].(string); ok {
			theme = t
		}
		animSpeed := "normal"
		if a, ok := settings["animationSpeed"].(string); ok {
			animSpeed = a
		}
		soundEnabled := 1
		if s, ok := settings["soundEnabled"].(bool); ok && !s {
			soundEnabled = 0
		}
		tx.Exec(
			"INSERT INTO class_settings (class_id, theme, animation_speed, sound_enabled) VALUES (?, ?, ?, ?)",
			classID, theme, animSpeed, soundEnabled,
		)
	}

	// 10. Import pet config
	if pc, ok := data["petConfig"].(map[string]interface{}); ok {
		enabled := 1
		if e, ok := pc["enabled"].(bool); ok && !e {
			enabled = 0
		}
		showCard := 1
		if s, ok := pc["showOnStudentCard"].(bool); ok && !s {
			showCard = 0
		}
		tx.Exec(
			"INSERT INTO pet_config (class_id, enabled, show_on_student_card) VALUES (?, ?, ?)",
			classID, enabled, showCard,
		)
	}

	// 11. Import pet species
	petSpeciesMap := make(map[string]int64)
	if species, ok := data["petSpecies"].([]interface{}); ok {
		for _, sp := range species {
			spm, ok := sp.(map[string]interface{})
			if !ok {
				continue
			}
			oldID := getString(spm, "id")
			name := getString(spm, "name")
			element := getString(spm, "element")
			color := getString(spm, "color")

			res, err := tx.Exec(
				"INSERT INTO pet_species (name, element, color, class_id) VALUES (?, ?, ?, ?)",
				name, element, color, classID,
			)
			if err != nil {
				return nil, fmt.Errorf("导入宠物种类失败: %w", err)
			}
			newID, _ := res.LastInsertId()
			petSpeciesMap[oldID] = newID

			if stages, ok := spm["stages"].([]interface{}); ok {
				for _, st := range stages {
					stm, ok := st.(map[string]interface{})
					if !ok {
						continue
					}
					level := getInt(stm, "level", 0)
					sName := getString(stm, "name")
					emoji := getString(stm, "emoji")
					image := getString(stm, "image")
					minScore := getInt(stm, "minScore", 0)
					desc := getString(stm, "description")

					tx.Exec(
						"INSERT INTO pet_stages (species_id, level, name, emoji, image, min_score, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
						newID, level, sName, emoji, image, minScore, desc,
					)
				}
			}
			result.PetSpeciesCount++
		}
	}

	// 12. Import student pets
	if pets, ok := data["studentPets"].([]interface{}); ok {
		for _, p := range pets {
			pm, ok := p.(map[string]interface{})
			if !ok {
				continue
			}
			oldStudentID := getString(pm, "studentId")
			oldSpeciesID := getString(pm, "speciesId")
			newStudentID, ok1 := studentMap[oldStudentID]
			newSpeciesID, ok2 := petSpeciesMap[oldSpeciesID]
			if !ok1 || !ok2 {
				continue
			}
			nickname := getString(pm, "nickname")
			if nickname == "" {
				nickname = "我的宠物"
			}
			assignedAt := getString(pm, "assignedAt")
			if assignedAt != "" {
				tx.Exec(
					"INSERT INTO student_pets (student_id, species_id, nickname, assigned_at) VALUES (?, ?, ?, ?)",
					newStudentID, newSpeciesID, nickname, assignedAt,
				)
			} else {
				tx.Exec(
					"INSERT INTO student_pets (student_id, species_id, nickname) VALUES (?, ?, ?)",
					newStudentID, newSpeciesID, nickname,
				)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return result, nil
}

// LoadLegacyUserData reads the old JSON file for a given username
func LoadLegacyUserData(userdataPath, username string) (map[string]interface{}, error) {
	safeName := sanitizeFilenameForMigrate(username)
	filePath := filepath.Join(userdataPath, safeName+".json")

	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func LegacyDataExists(userdataPath, username string) bool {
	safeName := sanitizeFilenameForMigrate(username)
	filePath := filepath.Join(userdataPath, safeName+".json")
	_, err := os.Stat(filePath)
	return err == nil
}

func sanitizeFilenameForMigrate(name string) string {
	result := make([]rune, 0, len(name))
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') || r == '_' || r == '-' ||
			(r >= '\u4e00' && r <= '\u9fff') {
			result = append(result, r)
		} else {
			result = append(result, '_')
		}
	}
	return string(result)
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getInt(m map[string]interface{}, key string, def int) int {
	if v, ok := m[key]; ok {
		switch n := v.(type) {
		case float64:
			return int(n)
		case int:
			return n
		case int64:
			return int(n)
		}
	}
	return def
}

// Unused but kept for reference
var _ = time.Now
