package setting

type SettingResponse struct {
	ID    string `json:"id"`
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UpdateSettingRequest struct {
	Value string `json:"value" validate:"required"`
}
