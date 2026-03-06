package setting

type SettingResponse struct {
	ID    string `json:"id"`
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UpdateSettingRequest struct {
	Value string `json:"value" validate:"required"`
}

type BankAccount struct {
	ID            string `json:"id"`
	BankName      string `json:"bankName"`
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
}

type PosPaymentSettings struct {
	Cash            bool          `json:"cash"`
	QrisMidtrans    bool          `json:"qrisMidtrans"`
	QrisStatic      bool          `json:"qrisStatic"`
	QrisStaticImage string        `json:"qrisStaticImage"`
	BankTransfer    bool          `json:"bankTransfer"`
	BankAccounts    []BankAccount `json:"bankAccounts"`
}
