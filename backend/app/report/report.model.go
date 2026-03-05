package report

// ReportFilter holds filter parameters for report queries
type ReportFilter struct {
	StartDate     string `query:"startDate"`
	EndDate       string `query:"endDate"`
	CashierID     string `query:"cashierId"`
	PaymentMethod string `query:"paymentMethod"`
}

// ReportSummaryResponse holds aggregated summary stats
type ReportSummaryResponse struct {
	TotalRevenue      int     `json:"totalRevenue"`
	TotalTransactions int     `json:"totalTransactions"`
	TotalItems        int     `json:"totalItems"`
	AverageOrder      float64 `json:"averageOrder"`
	CashRevenue       int     `json:"cashRevenue"`
	CashTransactions  int     `json:"cashTransactions"`
	QRISRevenue       int     `json:"qrisRevenue"`
	QRISTransactions  int     `json:"qrisTransactions"`
}

// DailyChartPoint represents one day of revenue data for chart display
type DailyChartPoint struct {
	Date         string `json:"date"`
	Revenue      int    `json:"revenue"`
	Transactions int    `json:"transactions"`
}

// SaleItemResponse holds the details of a single item in a sale
type SaleItemResponse struct {
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
	Price       int    `json:"price"`
	Subtotal    int    `json:"subtotal"`
}

// SaleDetailResponse represents a single sale row in the detail table
type SaleDetailResponse struct {
	ID            string             `json:"id"`
	CashierName   string             `json:"cashierName"`
	CustomerName  *string            `json:"customerName"`
	Total         int                `json:"total"`
	PaymentMethod string             `json:"paymentMethod"`
	ItemCount     int                `json:"itemCount"`
	Items         []SaleItemResponse `json:"items"`
	CreatedAt     string             `json:"createdAt"`
}

// CashierOption for filter dropdown
type CashierOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// TopProductResponse represents a top selling product
type TopProductResponse struct {
	ProductID   string `json:"productId"`
	ProductName string `json:"productName"`
	ImageURL    string `json:"imageUrl"`
	TotalQty    int    `json:"totalQty"`
	TotalSales  int    `json:"totalSales"`
}

type ProfitReportItem struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	CategoryName string  `json:"categoryName"`
	QtySold      int     `json:"qtySold"`
	AvgCost      int     `json:"avgCost"`
	SellingPrice int     `json:"sellingPrice"`
	Revenue      int     `json:"revenue"`
	COGS         int     `json:"cogs"`
	Profit       int     `json:"profit"`
	ProfitMargin float64 `json:"profitMargin"`
}

type ProfitReportResponse struct {
	Items        []ProfitReportItem `json:"items"`
	TotalRevenue int                `json:"totalRevenue"`
	TotalCOGS    int                `json:"totalCogs"`
	TotalProfit  int                `json:"totalProfit"`
}
