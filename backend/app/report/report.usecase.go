package report

import (
	"context"
	"fmt"
	"time"

	"hris_backend/entity"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportUseCase interface {
	GetSummary(ctx context.Context, filter *ReportFilter) (*ReportSummaryResponse, error)
	GetChartData(ctx context.Context, filter *ReportFilter) ([]DailyChartPoint, error)
	GetSalesDetail(ctx context.Context, filter *ReportFilter) ([]SaleDetailResponse, error)
	ExportExcel(ctx context.Context, filter *ReportFilter) ([]byte, error)
	GetCashiers(ctx context.Context) ([]CashierOption, error)
	GetTopProducts(ctx context.Context, limit int) ([]TopProductResponse, error)
	GetProfitReport(ctx context.Context, filter *ReportFilter) (*ProfitReportResponse, error)
}

type reportUseCase struct {
	DB         *gorm.DB
	Repository ReportRepository
}

func NewReportUseCase(db *gorm.DB, repository ReportRepository) ReportUseCase {
	return &reportUseCase{
		DB:         db,
		Repository: repository,
	}
}

func (u *reportUseCase) GetSummary(ctx context.Context, filter *ReportFilter) (*ReportSummaryResponse, error) {
	sales, err := u.Repository.GetFilteredSales(ctx, filter)
	if err != nil {
		return nil, err
	}

	summary := &ReportSummaryResponse{}
	for _, sale := range sales {
		summary.TotalRevenue += sale.Total
		summary.TotalTransactions++
		summary.TotalItems += len(sale.Items)

		for _, payment := range sale.Payments {
			if payment.Status == entity.PaymentStatusPaid {
				if payment.Method == entity.PaymentMethodCash {
					summary.CashRevenue += payment.Amount
					summary.CashTransactions++
				} else if payment.Method == entity.PaymentMethodQRIS {
					summary.QRISRevenue += payment.Amount
					summary.QRISTransactions++
				} else if payment.Method == entity.PaymentMethodTransfer {
					summary.TransferRevenue += payment.Amount
					summary.TransferTransactions++
				}
			}
		}
	}

	if summary.TotalTransactions > 0 {
		summary.AverageOrder = float64(summary.TotalRevenue) / float64(summary.TotalTransactions)
	}

	return summary, nil
}

func (u *reportUseCase) GetChartData(ctx context.Context, filter *ReportFilter) ([]DailyChartPoint, error) {
	return u.Repository.GetDailyAggregates(ctx, filter)
}

func (u *reportUseCase) GetSalesDetail(ctx context.Context, filter *ReportFilter) ([]SaleDetailResponse, error) {
	sales, err := u.Repository.GetFilteredSales(ctx, filter)
	if err != nil {
		return nil, err
	}

	var details []SaleDetailResponse
	for _, sale := range sales {
		cashierName := ""
		if sale.Cashier != nil {
			cashierName = sale.Cashier.Name
		}

		paymentMethod := "-"
		var providerRef *string
		for _, p := range sale.Payments {
			if p.Status == entity.PaymentStatusPaid {
				paymentMethod = string(p.Method)
				providerRef = p.ProviderRef
				break
			}
		}

		var saleItems []SaleItemResponse
		for _, item := range sale.Items {
			productName := "Unknown Product"
			if item.Product != nil {
				productName = item.Product.Name
			}
			saleItems = append(saleItems, SaleItemResponse{
				ProductName: productName,
				Quantity:    item.Qty,
				Price:       item.Price,
				Subtotal:    item.Subtotal,
			})
		}

		details = append(details, SaleDetailResponse{
			ID:            sale.ID,
			CashierName:   cashierName,
			CustomerName:  sale.CustomerName,
			Total:         sale.Total,
			PaymentMethod: paymentMethod,
			ProviderRef:   providerRef,
			ItemCount:     len(sale.Items),
			Items:         saleItems,
			CreatedAt:     sale.CreatedAt.Format(time.RFC3339),
		})
	}

	return details, nil
}

func (u *reportUseCase) ExportExcel(ctx context.Context, filter *ReportFilter) ([]byte, error) {
	sales, err := u.Repository.GetFilteredSales(ctx, filter)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laporan Penjualan"
	index, _ := f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")
	f.SetActiveSheet(index)

	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1F2937"}, Pattern: 1},
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 11},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "374151", Style: 1},
			{Type: "top", Color: "374151", Style: 1},
			{Type: "bottom", Color: "374151", Style: 1},
			{Type: "right", Color: "374151", Style: 1},
		},
	})

	// Data style
	dataStyle, _ := f.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
		},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	priceStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 3,
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
		},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	// Set headers
	headers := []string{"No", "ID Transaksi", "Kasir", "Pelanggan", "Jumlah Item", "Total", "Metode Bayar", "Detail Bank", "Tanggal"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	// Set column widths
	widths := []float64{6, 20, 18, 18, 12, 18, 14, 25, 22}
	for i, w := range widths {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth(sheet, col, col, w)
	}

	// Fill data
	for i, sale := range sales {
		row := i + 2
		cashierName := ""
		if sale.Cashier != nil {
			cashierName = sale.Cashier.Name
		}
		customerName := ""
		if sale.CustomerName != nil {
			customerName = *sale.CustomerName
		}
		paymentMethod := "-"
		providerRef := "-"
		for _, p := range sale.Payments {
			if p.Status == entity.PaymentStatusPaid {
				paymentMethod = string(p.Method)
				if p.ProviderRef != nil {
					providerRef = *p.ProviderRef
				}
				break
			}
		}

		rowData := []interface{}{
			i + 1,
			sale.ID,
			cashierName,
			customerName,
			len(sale.Items),
			sale.Total,
			paymentMethod,
			providerRef,
			sale.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		for j, val := range rowData {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			f.SetCellValue(sheet, cell, val)
			if j == 5 { // Total column uses price format
				f.SetCellStyle(sheet, cell, cell, priceStyle)
			} else {
				f.SetCellStyle(sheet, cell, cell, dataStyle)
			}
		}
	}

	// Write summary row
	summaryRow := len(sales) + 3
	cell, _ := excelize.CoordinatesToCellName(1, summaryRow)
	f.SetCellValue(sheet, cell, "Total Transaksi:")
	cell2, _ := excelize.CoordinatesToCellName(2, summaryRow)
	f.SetCellValue(sheet, cell2, len(sales))

	summaryRow2 := summaryRow + 1
	cell3, _ := excelize.CoordinatesToCellName(1, summaryRow2)
	f.SetCellValue(sheet, cell3, "Total Pendapatan:")
	cell4, _ := excelize.CoordinatesToCellName(2, summaryRow2)
	totalRevenue := 0
	for _, s := range sales {
		totalRevenue += s.Total
	}
	f.SetCellValue(sheet, cell4, totalRevenue)
	f.SetCellStyle(sheet, cell4, cell4, priceStyle)

	// Generate period label for filename
	period := "all"
	if filter.StartDate != "" && filter.EndDate != "" {
		period = fmt.Sprintf("%s_to_%s", filter.StartDate, filter.EndDate)
	} else if filter.StartDate != "" {
		period = fmt.Sprintf("from_%s", filter.StartDate)
	} else if filter.EndDate != "" {
		period = fmt.Sprintf("to_%s", filter.EndDate)
	}
	_ = period // used by handler for filename

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (u *reportUseCase) GetCashiers(ctx context.Context) ([]CashierOption, error) {
	return u.Repository.GetCashiers(ctx)
}

func (u *reportUseCase) GetTopProducts(ctx context.Context, limit int) ([]TopProductResponse, error) {
	return u.Repository.GetTopProducts(ctx, limit)
}

func (u *reportUseCase) GetProfitReport(ctx context.Context, filter *ReportFilter) (*ProfitReportResponse, error) {
	items, err := u.Repository.GetProfitReport(ctx, filter)
	if err != nil {
		return nil, err
	}

	totalRevenue := 0
	totalCOGS := 0
	totalProfit := 0

	for _, item := range items {
		totalRevenue += item.Revenue
		totalCOGS += item.COGS
		totalProfit += item.Profit
	}

	response := &ProfitReportResponse{
		Items:        items,
		TotalRevenue: totalRevenue,
		TotalCOGS:    totalCOGS,
		TotalProfit:  totalProfit,
	}

	return response, nil
}
