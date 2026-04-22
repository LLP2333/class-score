package model

type MigrateData struct {
	ClassInfo       map[string]interface{}   `json:"classInfo"`
	Students        []map[string]interface{} `json:"students"`
	Groups          []map[string]interface{} `json:"groups"`
	Rules           []map[string]interface{} `json:"rules"`
	ScoreRecords    []map[string]interface{} `json:"scoreRecords"`
	Products        []map[string]interface{} `json:"products"`
	Exchanges       []map[string]interface{} `json:"exchanges"`
	RollCallHistory []map[string]interface{} `json:"rollCallHistory"`
	Settings        map[string]interface{}   `json:"settings"`
	PetConfig       map[string]interface{}   `json:"petConfig"`
	PetSpecies      []map[string]interface{} `json:"petSpecies"`
	StudentPets     []map[string]interface{} `json:"studentPets"`
}
