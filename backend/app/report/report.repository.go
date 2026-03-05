package report

import (
	"context"
	"time"

	"hris_backend/entity"

	"gorm.io/gorm"
)

type ReportRepository interface {
	GetFilteredSales(ctx context.Context, filter *ReportFilter) ([]entity.Sale, error)
	GetDailyAggregates(ctx context.Context, filter *ReportFilter) ([]DailyChartPoint, error)
	GetCashiers(ctx context.Context) ([]CashierOption, error)
	GetTopProducts(ctx context.Context, limit int) ([]TopProductResponse, error)
	GetProfitReport(ctx context.Context, filter *ReportFilter) ([]ProfitReportItem, error)
}

type reportRepository struct {
	DB *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{DB: db}
}

func (r *reportRepository) applyFilters(query *gorm.DB, filter *ReportFilter) *gorm.DB {
	if filter.StartDate != "" {
		query = query.Where("sales.created_at >= ?", filter.StartDate+" 00:00:00")
	}
	if filter.EndDate != "" {
		query = query.Where("sales.created_at <= ?", filter.EndDate+" 23:59:59")
	}
	if filter.CashierID != "" {
		query = query.Where("sales.cashier_id = ?", filter.CashierID)
	}
	// Payment method filter is handled after join with payments table
	return query
}

func (r *reportRepository) GetFilteredSales(ctx context.Context, filter *ReportFilter) ([]entity.Sale, error) {
	var sales []entity.Sale
	query := r.DB.WithContext(ctx).
		Preload("Cashier").
		Preload("Items").
		Preload("Items.Product").
		Preload("Payments").
		Where("sales.status = ?", entity.SaleStatusPaid)

	query = r.applyFilters(query, filter)

	// If payment method filter is set, join payments table
	if filter.PaymentMethod != "" {
		query = query.Joins("JOIN payments ON payments.sale_id = sales.id").
			Where("payments.method = ? AND payments.status = ?", filter.PaymentMethod, entity.PaymentStatusPaid)
	}

	query = query.Order("sales.created_at DESC")
	err := query.Find(&sales).Error
	return sales, err
}

func (r *reportRepository) GetDailyAggregates(ctx context.Context, filter *ReportFilter) ([]DailyChartPoint, error) {
	var results []DailyChartPoint

	query := r.DB.WithContext(ctx).
		Table("sales").
		Select("DATE(sales.created_at) as date, COALESCE(SUM(sales.total), 0) as revenue, COUNT(sales.id) as transactions").
		Where("sales.status = ?", entity.SaleStatusPaid)

	query = r.applyFilters(query, filter)

	if filter.PaymentMethod != "" {
		query = query.Joins("JOIN payments ON payments.sale_id = sales.id").
			Where("payments.method = ? AND payments.status = ?", filter.PaymentMethod, entity.PaymentStatusPaid)
	}

	query = query.Group("DATE(sales.created_at)").Order("date ASC")

	rows, err := query.Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var point DailyChartPoint
		var date time.Time
		if err := rows.Scan(&date, &point.Revenue, &point.Transactions); err != nil {
			return nil, err
		}
		point.Date = date.Format("2006-01-02")
		results = append(results, point)
	}

	return results, nil
}

func (r *reportRepository) GetCashiers(ctx context.Context) ([]CashierOption, error) {
	var cashiers []CashierOption
	err := r.DB.WithContext(ctx).
		Table("users").
		Select("id, name").
		Where("deleted_at IS NULL").
		Order("name ASC").
		Scan(&cashiers).Error
	return cashiers, err
}

func (r *reportRepository) GetTopProducts(ctx context.Context, limit int) ([]TopProductResponse, error) {
	var results []TopProductResponse
	err := r.DB.WithContext(ctx).
		Table("sale_items").
		Select("sale_items.product_id as product_id, products.name as product_name, COALESCE(products.image_url, '') as image_url, SUM(sale_items.qty) as total_qty, SUM(sale_items.subtotal) as total_sales").
		Joins("JOIN sales ON sales.id = sale_items.sale_id AND sales.status = ? AND sales.deleted_at IS NULL", entity.SaleStatusPaid).
		Joins("JOIN products ON products.id = sale_items.product_id AND products.deleted_at IS NULL").
		Group("sale_items.product_id, products.name, products.image_url").
		Order("total_qty DESC").
		Limit(limit).
		Scan(&results).Error
	return results, err
}

func (r *reportRepository) GetProfitReport(ctx context.Context, filter *ReportFilter) ([]ProfitReportItem, error) {
	var results []ProfitReportItem

	query := r.DB.WithContext(ctx).
		Table("sale_items si").
		Select(`
			p.id as product_id,
			p.name as product_name,
			COALESCE(cat.name, '') as category_name,
			SUM(si.qty) as qty_sold,
			ROUND(COALESCE(avg_stock.avg_cost, p.cost, 0)) as avg_cost,
			ROUND(AVG(si.price)) as selling_price,
			SUM(si.subtotal) as revenue,
			SUM(si.qty) * ROUND(COALESCE(avg_stock.avg_cost, p.cost, 0)) as cogs,
			SUM(si.subtotal) - (SUM(si.qty) * ROUND(COALESCE(avg_stock.avg_cost, p.cost, 0))) as profit
		`).
		Joins("JOIN sales s ON s.id = si.sale_id AND s.status = ? AND s.deleted_at IS NULL", entity.SaleStatusPaid).
		Joins("JOIN products p ON p.id = si.product_id AND p.deleted_at IS NULL").
		Joins("LEFT JOIN categories cat ON cat.id = p.category_id AND cat.deleted_at IS NULL").
		Joins(`LEFT JOIN (
			SELECT product_id, AVG(cost_per_unit) as avg_cost 
			FROM stock_ins 
			WHERE deleted_at IS NULL 
			GROUP BY product_id
		) avg_stock ON avg_stock.product_id = si.product_id`)

	// Apply filters on sale
	if filter != nil {
		if filter.StartDate != "" && filter.EndDate != "" {
			query = query.Where("DATE(s.created_at) BETWEEN ? AND ?", filter.StartDate, filter.EndDate)
		}
		if filter.CashierID != "" {
			query = query.Where("s.cashier_id = ?", filter.CashierID)
		}
		// Notice: payment method filtering requires joining payments table again if needed,
		// but since it's profit report usually we just care if it's PAID.
		if filter.PaymentMethod != "" {
			query = query.Joins("JOIN payments py ON py.sale_id = s.id AND py.method = ? AND py.status = ?", filter.PaymentMethod, entity.PaymentStatusPaid)
		}
	}

	err := query.Group("p.id, p.name, cat.name, avg_stock.avg_cost, p.cost").
		Order("profit DESC").
		Scan(&results).Error

	// Calculate Profit Margin
	for i := range results {
		if results[i].Revenue > 0 {
			results[i].ProfitMargin = float64(results[i].Profit) / float64(results[i].Revenue) * 100.0
		}
	}

	return results, err
}
