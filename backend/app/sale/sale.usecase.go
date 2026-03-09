package sale

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"hris_backend/entity"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

type SaleUseCase interface {
	FindAll(ctx context.Context, status string) ([]SaleResponse, error)
	Create(ctx context.Context, cashierId string, request *CreateSaleRequest) (*SaleResponse, error)
	GetByID(ctx context.Context, id string) (*SaleResponse, error)
	UpdateStatus(ctx context.Context, id string, request *UpdateSaleStatusRequest) (*SaleResponse, error)
	PayCash(ctx context.Context, id string, request *PayCashRequest) (*PaymentResponse, error)
	PaySplit(ctx context.Context, id string, request *PaySplitRequest) (*SplitPaymentResponse, error)
	PayQRIS(ctx context.Context, id string) (*PaymentResponse, error)
	PayQRISStatic(ctx context.Context, id string) (*PaymentResponse, error)
	PayTransfer(ctx context.Context, id string, request *PayTransferRequest) (*PaymentResponse, error)
	GetQRISStatus(ctx context.Context, saleId string) (*QRISStatusResponse, error)
	GetDailyReport(ctx context.Context, date string) (*DailyReportResponse, error)
	MidtransNotification(ctx context.Context, payload map[string]interface{}) error
	GenerateSnapToken(ctx context.Context, id string) (*SnapTokenResponse, error)
}

type saleUseCase struct {
	DB         *gorm.DB
	Repository SaleRepository
	Config     *viper.Viper
}

func NewSaleUseCase(db *gorm.DB, repository SaleRepository, config *viper.Viper) SaleUseCase {
	return &saleUseCase{
		DB:         db,
		Repository: repository,
		Config:     config,
	}
}

func (u *saleUseCase) newMidtransClient() coreapi.Client {
	serverKey := u.Config.GetString("midtrans.server_key")
	midtransEnv := u.Config.GetString("midtrans.env")

	var mtEnv midtrans.EnvironmentType
	if midtransEnv == "production" {
		mtEnv = midtrans.Production
	} else {
		mtEnv = midtrans.Sandbox
	}

	c := coreapi.Client{}
	c.New(serverKey, mtEnv)
	return c
}

func (u *saleUseCase) FindAll(ctx context.Context, status string) ([]SaleResponse, error) {
	sales, err := u.Repository.FindAll(ctx, status)
	if err != nil {
		return nil, err
	}

	responses := make([]SaleResponse, 0, len(sales))
	for _, sale := range sales {
		responses = append(responses, *u.toResponse(&sale))
	}

	return responses, nil
}

func (u *saleUseCase) Create(ctx context.Context, cashierId string, request *CreateSaleRequest) (*SaleResponse, error) {
	if len(request.Items) == 0 {
		return nil, errors.New("sale must have at least one item")
	}

	sale := &entity.Sale{
		CashierID:    cashierId,
		LocationID:   request.LocationID,
		CustomerName: request.CustomerName,
		Status:       entity.SaleStatusPending,
		Total:        0,
	}

	var total int
	var saleItems []entity.SaleItem
	for _, item := range request.Items {
		product := new(entity.Product)
		if err := u.DB.WithContext(ctx).First(product, "id = ?", item.ProductID).Error; err != nil {
			return nil, errors.New("product not found: " + item.ProductID)
		}

		var inv entity.Inventory
		u.DB.WithContext(ctx).First(&inv, "product_id = ? AND location_id = ?", item.ProductID, request.LocationID)

		subtotal := product.Price * item.Qty
		total += subtotal

		saleItems = append(saleItems, entity.SaleItem{
			ProductID: item.ProductID,
			Qty:       item.Qty,
			Price:     product.Price,
			HPP:       inv.AvgCost,
			Subtotal:  subtotal,
		})
	}

	sale.Total = total
	sale.Items = saleItems

	err := u.Repository.Create(ctx, sale)
	if err != nil {
		return nil, err
	}

	return u.toResponse(sale), nil
}

func (u *saleUseCase) GetByID(ctx context.Context, id string) (*SaleResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.toResponse(sale), nil
}

func (u *saleUseCase) UpdateStatus(ctx context.Context, id string, request *UpdateSaleStatusRequest) (*SaleResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	targetStatus := entity.SaleStatus(request.Status)
	if targetStatus != entity.SaleStatusCancelled {
		return nil, errors.New("unsupported status update")
	}

	if sale.Status == entity.SaleStatusPaid {
		return nil, errors.New("cannot cancel paid sale")
	}

	if sale.Status == entity.SaleStatusCancelled {
		return u.toResponse(sale), nil
	}

	sale.Status = entity.SaleStatusCancelled
	if err := u.Repository.Update(ctx, sale); err != nil {
		return nil, err
	}

	return u.toResponse(sale), nil
}

func (u *saleUseCase) PayCash(ctx context.Context, id string, request *PayCashRequest) (*PaymentResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	if request.Amount < sale.Total {
		return nil, errors.New("insufficient payment amount")
	}

	payment := &entity.Payment{
		SaleID:   sale.ID,
		Method:   entity.PaymentMethodCash,
		Provider: entity.PaymentProviderNone,
		Amount:   sale.Total,
		Status:   entity.PaymentStatusPaid,
	}

	err = u.Repository.CreatePayment(ctx, payment)
	if err != nil {
		return nil, err
	}

	sale.Status = entity.SaleStatusPaid
	err = u.Repository.Update(ctx, sale)
	if err != nil {
		return nil, err
	}

	// Deduct inventory and record stock movement for each item
	if err := u.deductStockForSale(ctx, sale); err != nil {
		return nil, err
	}

	return &PaymentResponse{
		ID:        payment.ID,
		SaleID:    payment.SaleID,
		Method:    string(payment.Method),
		Provider:  string(payment.Provider),
		Amount:    payment.Amount,
		Status:    string(payment.Status),
		CreatedAt: payment.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (u *saleUseCase) PaySplit(ctx context.Context, id string, request *PaySplitRequest) (*SplitPaymentResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	if len(request.Payments) < 2 {
		return nil, errors.New("split bill requires at least 2 payment lines")
	}

	for _, existingPayment := range sale.Payments {
		if existingPayment.Status == entity.PaymentStatusPending || existingPayment.Status == entity.PaymentStatusPaid {
			return nil, errors.New("sale already has payment record")
		}
	}

	var totalAmount int
	preparedPayments := make([]entity.Payment, 0, len(request.Payments))
	splitItems := make([]SplitPaymentItemResponse, 0, len(request.Payments))

	for _, item := range request.Payments {
		if item.Amount <= 0 {
			return nil, errors.New("split payment amount must be greater than 0")
		}

		totalAmount += item.Amount

		method := strings.ToLower(strings.TrimSpace(item.Method))
		payment := entity.Payment{
			SaleID:   sale.ID,
			Provider: entity.PaymentProviderNone,
			Amount:   item.Amount,
			Status:   entity.PaymentStatusPaid,
		}

		responseItem := SplitPaymentItemResponse{
			Method: method,
			Amount: item.Amount,
		}

		switch method {
		case "cash":
			payment.Method = entity.PaymentMethodCash
		case "qris_static":
			payment.Method = entity.PaymentMethodQRIS
		case "transfer":
			payment.Method = entity.PaymentMethodTransfer
			bankDetails := strings.TrimSpace(derefString(item.BankDetails))
			if bankDetails == "" {
				return nil, errors.New("bank details are required for transfer split payment")
			}
			payment.ProviderRef = &bankDetails
			responseItem.BankDetails = &bankDetails
		default:
			return nil, errors.New("unsupported split payment method")
		}

		preparedPayments = append(preparedPayments, payment)
		splitItems = append(splitItems, responseItem)
	}

	if totalAmount != sale.Total {
		return nil, fmt.Errorf("total split amount must equal sale total (%d)", sale.Total)
	}

	for i := range preparedPayments {
		payment := preparedPayments[i]
		if err := u.Repository.CreatePayment(ctx, &payment); err != nil {
			return nil, err
		}
	}

	sale.Status = entity.SaleStatusPaid
	if err := u.Repository.Update(ctx, sale); err != nil {
		return nil, err
	}

	if err := u.deductStockForSale(ctx, sale); err != nil {
		return nil, err
	}

	return &SplitPaymentResponse{
		SaleID:   sale.ID,
		Total:    sale.Total,
		Payments: splitItems,
	}, nil
}

func (u *saleUseCase) PayQRIS(ctx context.Context, id string) (*PaymentResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	// Check if there's already a pending QRIS payment
	var existingPayment entity.Payment
	if result := u.DB.Where("sale_id = ? AND method = ? AND status = ?", sale.ID, entity.PaymentMethodQRIS, entity.PaymentStatusPending).First(&existingPayment); result.Error == nil {
		// Return existing pending QRIS payment
		return &PaymentResponse{
			ID:          existingPayment.ID,
			SaleID:      existingPayment.SaleID,
			Method:      string(existingPayment.Method),
			Provider:    string(existingPayment.Provider),
			Amount:      existingPayment.Amount,
			Status:      string(existingPayment.Status),
			QRISUrl:     existingPayment.QRISUrl,
			ProviderRef: existingPayment.ProviderRef,
			CreatedAt:   existingPayment.CreatedAt.Format(time.RFC3339),
		}, nil
	}

	c := u.newMidtransClient()

	// Map sale items to Midtrans item details
	var itemDetails []midtrans.ItemDetails
	for _, item := range sale.Items {
		name := "Produk"
		if item.Product != nil && item.Product.Name != "" {
			name = item.Product.Name
		} else {
			// fallback if Product relation is not preloaded properly
			var p entity.Product
			if err := u.DB.First(&p, "id = ?", item.ProductID).Error; err == nil {
				name = p.Name
			}
		}

		itemDetails = append(itemDetails, midtrans.ItemDetails{
			ID:    item.ProductID,
			Name:  name,
			Price: int64(item.Price),
			Qty:   int32(item.Qty),
		})
	}

	// Create QRIS charge request
	chargeReq := &coreapi.ChargeReq{
		PaymentType: coreapi.PaymentTypeQris,
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  fmt.Sprintf("SALE-%s", sale.ID),
			GrossAmt: int64(sale.Total),
		},
		Items: &itemDetails,
		Qris: &coreapi.QrisDetails{
			Acquirer: "gopay",
		},
	}

	chargeRes, midtransErr := c.ChargeTransaction(chargeReq)
	if midtransErr != nil {
		return nil, fmt.Errorf("midtrans charge failed: %s", midtransErr.GetMessage())
	}

	// Extract QR code string from response
	// Midtrans Sandbox Simulator often prefers the 'generate-qr-code' action URL over the raw QR string.
	// So we prioritize Action URL first, then fallback to QRString.
	var qrisUrl string
	for _, action := range chargeRes.Actions {
		if action.Name == "generate-qr-code" {
			qrisUrl = action.URL
			break
		}
	}
	if qrisUrl == "" {
		qrisUrl = chargeRes.QRString
	}

	providerRef := chargeRes.TransactionID

	payment := &entity.Payment{
		SaleID:      sale.ID,
		Method:      entity.PaymentMethodQRIS,
		Provider:    entity.PaymentProviderMidtrans,
		Amount:      sale.Total,
		Status:      entity.PaymentStatusPending,
		QRISUrl:     &qrisUrl,
		ProviderRef: &providerRef,
	}

	err = u.Repository.CreatePayment(ctx, payment)
	if err != nil {
		return nil, err
	}

	return &PaymentResponse{
		ID:          payment.ID,
		SaleID:      payment.SaleID,
		Method:      string(payment.Method),
		Provider:    string(payment.Provider),
		Amount:      payment.Amount,
		Status:      string(payment.Status),
		QRISUrl:     payment.QRISUrl,
		ProviderRef: payment.ProviderRef,
		CreatedAt:   payment.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (u *saleUseCase) PayQRISStatic(ctx context.Context, id string) (*PaymentResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	payment := &entity.Payment{
		SaleID:   sale.ID,
		Method:   entity.PaymentMethodQRIS,
		Provider: entity.PaymentProviderNone,
		Amount:   sale.Total,
		Status:   entity.PaymentStatusPaid,
	}

	err = u.Repository.CreatePayment(ctx, payment)
	if err != nil {
		return nil, err
	}

	sale.Status = entity.SaleStatusPaid
	err = u.Repository.Update(ctx, sale)
	if err != nil {
		return nil, err
	}

	if err := u.deductStockForSale(ctx, sale); err != nil {
		return nil, err
	}

	return &PaymentResponse{
		ID:        payment.ID,
		SaleID:    payment.SaleID,
		Method:    string(payment.Method),
		Provider:  string(payment.Provider),
		Amount:    payment.Amount,
		Status:    string(payment.Status),
		CreatedAt: payment.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (u *saleUseCase) PayTransfer(ctx context.Context, id string, request *PayTransferRequest) (*PaymentResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	payment := &entity.Payment{
		SaleID:      sale.ID,
		Method:      entity.PaymentMethodTransfer,
		Provider:    entity.PaymentProviderNone,
		ProviderRef: &request.BankDetails,
		Amount:      sale.Total,
		Status:      entity.PaymentStatusPaid,
	}

	err = u.Repository.CreatePayment(ctx, payment)
	if err != nil {
		return nil, err
	}

	sale.Status = entity.SaleStatusPaid
	err = u.Repository.Update(ctx, sale)
	if err != nil {
		return nil, err
	}

	if err := u.deductStockForSale(ctx, sale); err != nil {
		return nil, err
	}

	return &PaymentResponse{
		ID:          payment.ID,
		SaleID:      payment.SaleID,
		Method:      string(payment.Method),
		Provider:    string(payment.Provider),
		ProviderRef: payment.ProviderRef,
		Amount:      payment.Amount,
		Status:      string(payment.Status),
		CreatedAt:   payment.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (u *saleUseCase) newSnapClient() snap.Client {
	serverKey := u.Config.GetString("midtrans.server_key")
	midtransEnv := u.Config.GetString("midtrans.env")

	var mtEnv midtrans.EnvironmentType
	if midtransEnv == "production" {
		mtEnv = midtrans.Production
	} else {
		mtEnv = midtrans.Sandbox
	}

	var s snap.Client
	s.New(serverKey, mtEnv)
	return s
}

func (u *saleUseCase) GenerateSnapToken(ctx context.Context, id string) (*SnapTokenResponse, error) {
	sale, err := u.Repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if sale.Status != entity.SaleStatusPending {
		return nil, errors.New("sale is not pending")
	}

	// Check if there's already a pending SNAP or QRIS payment, we can reuse or just override via order_id.
	// For simplicity, we create a new token each time or let Midtrans handle it.
	// Due to order_id uniqueness in Midtrans, we might need a unique suffix.
	// Midtrans order_id max length is 50 chars. sale.ID (UUID) is 36 chars.
	// "ORD-" + 8 chars + "-" + 10 chars (unix timestamp) = 24 chars, well within limits.
	shortId := sale.ID
	if len(sale.ID) > 8 {
		shortId = sale.ID[:8]
	}
	orderId := fmt.Sprintf("ORD-%s-%d", shortId, time.Now().Unix())

	s := u.newSnapClient()

	// Map items
	var itemDetails []midtrans.ItemDetails
	for _, item := range sale.Items {
		name := "Produk"
		if item.Product != nil && item.Product.Name != "" {
			name = item.Product.Name
		} else {
			var p entity.Product
			if err := u.DB.First(&p, "id = ?", item.ProductID).Error; err == nil {
				name = p.Name
			}
		}
		itemDetails = append(itemDetails, midtrans.ItemDetails{
			ID:    item.ProductID,
			Name:  name,
			Price: int64(item.Price),
			Qty:   int32(item.Qty),
		})
	}

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderId,
			GrossAmt: int64(sale.Total),
		},
		Items: &itemDetails,
	}

	snapResp, midtransErr := s.CreateTransaction(req)
	if midtransErr != nil {
		return nil, fmt.Errorf("failed to generate snap token: %s", midtransErr.GetMessage())
	}

	// Record payment intent in DB using the generated Order ID as Provider Ref
	payment := &entity.Payment{
		SaleID:      sale.ID,
		Method:      entity.PaymentMethodQRIS, // Using QRIS type internally to match existing DB enums, or we can use another if SNAP enum exists. Assuming QRIS/Online.
		Provider:    entity.PaymentProviderMidtrans,
		Amount:      sale.Total,
		Status:      entity.PaymentStatusPending,
		ProviderRef: &orderId,
	}
	u.DB.Create(payment)

	return &SnapTokenResponse{
		Token:       snapResp.Token,
		RedirectURL: snapResp.RedirectURL,
	}, nil
}

func (u *saleUseCase) GetQRISStatus(ctx context.Context, saleId string) (*QRISStatusResponse, error) {
	// Find pending QRIS payment for this sale
	var payment entity.Payment
	if err := u.DB.Where("sale_id = ? AND method = ?", saleId, entity.PaymentMethodQRIS).
		Order("created_at DESC").First(&payment).Error; err != nil {
		return nil, errors.New("no QRIS payment found for this sale")
	}

	// If already paid/expired, return cached status
	if payment.Status != entity.PaymentStatusPending {
		return &QRISStatusResponse{
			PaymentID: payment.ID,
			SaleID:    payment.SaleID,
			Status:    string(payment.Status),
			TransactionID: func() string {
				if payment.ProviderRef != nil {
					return *payment.ProviderRef
				}
				return ""
			}(),
		}, nil
	}

	// Check status from Midtrans
	if payment.ProviderRef == nil {
		return nil, errors.New("no provider reference found for this payment")
	}

	c := u.newMidtransClient()
	statusRes, midtransErr := c.CheckTransaction(*payment.ProviderRef)
	if midtransErr != nil {
		return nil, fmt.Errorf("failed to check midtrans status: %s", midtransErr.GetMessage())
	}

	// Map Midtrans transaction status to our status
	var newStatus entity.PaymentStatus
	transactionStatus := statusRes.TransactionStatus
	fraudStatus := statusRes.FraudStatus

	switch transactionStatus {
	case "settlement", "capture":
		if fraudStatus == "accept" || fraudStatus == "" {
			newStatus = entity.PaymentStatusPaid
		} else {
			newStatus = entity.PaymentStatusFailed
		}
	case "expire":
		newStatus = entity.PaymentStatusExpired
	case "cancel", "deny":
		newStatus = entity.PaymentStatusFailed
	default:
		newStatus = entity.PaymentStatusPending
	}

	// Update payment status if changed
	if newStatus != entity.PaymentStatusPending && newStatus != payment.Status {
		payment.Status = newStatus
		u.DB.Save(&payment)

		// If paid, mark sale as paid and deduct inventory
		if newStatus == entity.PaymentStatusPaid {
			var sale entity.Sale
			if err := u.DB.Preload("Items").First(&sale, "id = ?", saleId).Error; err == nil {
				sale.Status = entity.SaleStatusPaid
				u.DB.Save(&sale)

				u.deductStockForSale(ctx, &sale)
			}
		}
	}

	return &QRISStatusResponse{
		PaymentID:     payment.ID,
		SaleID:        payment.SaleID,
		Status:        string(newStatus),
		TransactionID: statusRes.TransactionID,
	}, nil
}

func (u *saleUseCase) GetDailyReport(ctx context.Context, date string) (*DailyReportResponse, error) {
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	sales, err := u.Repository.GetDailySales(ctx, date)
	if err != nil {
		return nil, err
	}

	report := &DailyReportResponse{
		Date:         date,
		TotalSales:   len(sales),
		TotalRevenue: 0,
		TotalItems:   0,
		CashSales:    0,
		QRISSales:    0,
	}

	for _, sale := range sales {
		report.TotalRevenue += sale.Total
		report.TotalItems += len(sale.Items)

		for _, payment := range sale.Payments {
			if payment.Method == entity.PaymentMethodCash && payment.Status == entity.PaymentStatusPaid {
				report.CashSales++
			} else if payment.Method == entity.PaymentMethodQRIS && payment.Status == entity.PaymentStatusPaid {
				report.QRISSales++
			} else if payment.Method == entity.PaymentMethodTransfer && payment.Status == entity.PaymentStatusPaid {
				report.TransferSales++
			}
		}
	}

	return report, nil
}

func (u *saleUseCase) MidtransNotification(ctx context.Context, payload map[string]interface{}) error {
	orderId, ok := payload["order_id"].(string)
	if !ok {
		return errors.New("invalid order_id in notification payload")
	}

	// In Midtrans we send orderId either as "SALE-{ID}" or "SNAP-{ShortID}-{Time}"
	// This exact orderId is saved as ProviderRef in our Payment table.
	var payment entity.Payment
	if err := u.DB.Where("provider_ref = ? OR (sale_id = ? AND method = ?)", orderId, orderId[5:], entity.PaymentMethodQRIS). // Fallback for old QRIS format without provider_ref sync
																	Order("created_at DESC").First(&payment).Error; err != nil {
		return fmt.Errorf("payment not found for order_id %s", orderId)
	}

	saleId := payment.SaleID
	transactionStatus, _ := payload["transaction_status"].(string)
	fraudStatus, _ := payload["fraud_status"].(string)

	// Map status
	var newStatus entity.PaymentStatus
	switch transactionStatus {
	case "settlement", "capture":
		if fraudStatus == "accept" || fraudStatus == "" {
			newStatus = entity.PaymentStatusPaid
		} else {
			newStatus = entity.PaymentStatusFailed
		}
	case "expire":
		newStatus = entity.PaymentStatusExpired
	case "cancel", "deny":
		newStatus = entity.PaymentStatusFailed
	default:
		newStatus = entity.PaymentStatusPending
	}

	if newStatus != entity.PaymentStatusPending && newStatus != payment.Status {
		payment.Status = newStatus
		u.DB.Save(&payment)

		if newStatus == entity.PaymentStatusPaid {
			var sale entity.Sale
			if err := u.DB.Preload("Items").First(&sale, "id = ?", saleId).Error; err == nil {
				sale.Status = entity.SaleStatusPaid
				u.DB.Save(&sale)

				u.deductStockForSale(ctx, &sale)
			}
		}
	}
	return nil
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func (u *saleUseCase) toResponse(sale *entity.Sale) *SaleResponse {
	var items []SaleItemResponse
	for _, item := range sale.Items {
		productName := ""
		if item.Product != nil {
			productName = item.Product.Name
		}
		items = append(items, SaleItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: productName,
			Qty:         item.Qty,
			Price:       item.Price,
			Subtotal:    item.Subtotal,
		})
	}

	cashierName := ""
	if sale.Cashier != nil {
		cashierName = sale.Cashier.Name
	}

	locationName := ""
	if sale.Location != nil {
		locationName = sale.Location.Name
	}

	return &SaleResponse{
		ID:           sale.ID,
		CashierID:    sale.CashierID,
		CashierName:  cashierName,
		LocationID:   sale.LocationID,
		LocationName: locationName,
		CustomerName: sale.CustomerName,
		Status:       string(sale.Status),
		Total:        sale.Total,
		Items:        items,
		CreatedAt:    sale.CreatedAt.Format(time.RFC3339),
	}
}

func (u *saleUseCase) deductStockForSale(ctx context.Context, sale *entity.Sale) error {
	return u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, item := range sale.Items {
			var inv entity.Inventory
			if err := tx.First(&inv, "product_id = ? AND location_id = ?", item.ProductID, sale.LocationID).Error; err != nil {
				// Create empty inventory to deduct from if not exists
				inv = entity.Inventory{
					ProductID:  item.ProductID,
					LocationID: sale.LocationID,
					QtyOnHand:  0,
					TotalCost:  0,
					AvgCost:    0,
				}
			}

			deductedCost := inv.AvgCost * item.Qty
			inv.QtyOnHand -= item.Qty
			inv.TotalCost -= deductedCost
			if inv.QtyOnHand > 0 {
				inv.AvgCost = inv.TotalCost / inv.QtyOnHand
			} else {
				inv.AvgCost = 0
				inv.TotalCost = 0
			}

			if err := tx.Save(&inv).Error; err != nil {
				return err
			}

			movement := &entity.StockMovement{
				ProductID:  item.ProductID,
				LocationID: sale.LocationID,
				Type:       entity.StockMovementTypeSale,
				QtyDelta:   -item.Qty,
				RefSaleID:  &sale.ID,
			}
			if err := tx.Create(movement).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
