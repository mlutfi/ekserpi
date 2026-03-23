package payroll

import (
	"bytes"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
)

type payslipPDFLine struct {
	Font string
	Size int
	Y    float64
	Text string
}

func generatePayslipPDF(payroll *PayrollResponse) ([]byte, string, error) {
	if payroll == nil {
		return nil, "", errors.New("payroll is empty")
	}

	employeeName := strings.TrimSpace(payroll.EmployeeName)
	if employeeName == "" {
		employeeName = payroll.EmployeeID
	}
	filename := fmt.Sprintf("slip-gaji-%s-%s.pdf", sanitizeFileName(employeeName), payroll.Period)

	content := buildPayslipContent(payroll)
	pdfBytes, err := buildSinglePagePDF(content)
	if err != nil {
		return nil, "", err
	}
	return pdfBytes, filename, nil
}

func buildPayslipContent(payroll *PayrollResponse) string {
	lines := make([]payslipPDFLine, 0, 48)
	y := 805.0

	appendLine := func(font string, size int, text string) {
		lines = append(lines, payslipPDFLine{Font: font, Size: size, Y: y, Text: text})
		y -= 16
	}

	appendSpacer := func(height float64) {
		y -= height
	}

	employeeType := payroll.EmployeeType
	if employeeType == "" {
		employeeType = "KARYAWAN_TETAP"
	}

	appendLine("F2", 18, "SLIP GAJI")
	appendLine("F1", 11, fmt.Sprintf("Periode: %s", payroll.Period))
	appendLine("F1", 11, fmt.Sprintf("Dicetak: %s", time.Now().Format("2006-01-02 15:04")))
	appendSpacer(6)

	appendLine("F2", 12, "Data Karyawan")
	appendLine("F1", 11, fmt.Sprintf("Nama: %s", valueOrDash(payroll.EmployeeName)))
	appendLine("F1", 11, fmt.Sprintf("ID Karyawan: %s", valueOrDash(payroll.EmployeeID)))
	appendLine("F1", 11, fmt.Sprintf("Jenis Karyawan: %s", employeeType))
	if payroll.IsProrated {
		appendLine("F1", 11, fmt.Sprintf("Prorata: %d/%d hari (faktor %.4f)", payroll.ProrateDays, payroll.PeriodDays, payroll.ProrateFactor))
	}
	appendSpacer(6)

	appendLine("F2", 12, "Pendapatan")
	appendLine("F1", 11, fmt.Sprintf("Gaji Pokok: %s", formatRupiah(payroll.BasicSalary)))
	appendLine("F1", 11, fmt.Sprintf("Tunjangan: %s", formatRupiah(payroll.Allowance)))
	appendLine("F1", 11, fmt.Sprintf("Bonus: %s", formatRupiah(payroll.Bonus)))
	appendLine("F1", 11, fmt.Sprintf("Komisi: %s", formatRupiah(payroll.Commission)))
	appendLine("F1", 11, fmt.Sprintf("Lembur: %s", formatRupiah(payroll.Overtime)))
	appendLine("F2", 11, fmt.Sprintf("Total Pendapatan: %s", formatRupiah(payroll.TotalIncome)))
	appendSpacer(6)

	appendLine("F2", 12, "Potongan Karyawan")
	appendLine("F1", 11, fmt.Sprintf("Potongan Terlambat: %s", formatRupiah(payroll.LateDeduction)))
	appendLine("F1", 11, fmt.Sprintf("Potongan Absen: %s", formatRupiah(payroll.AbsentDeduction)))
	appendLine("F1", 11, fmt.Sprintf("BPJS Employee: %s", formatRupiah(payroll.BPJSEmployee)))
	appendLine("F1", 11, fmt.Sprintf("THT: %s", formatRupiah(payroll.THT)))
	appendLine("F1", 11, fmt.Sprintf("PPh21: %s", formatRupiah(payroll.Tax)))
	appendLine("F1", 11, fmt.Sprintf("Potongan Lain: %s", formatRupiah(payroll.OtherDeduction)))
	appendLine("F2", 11, fmt.Sprintf("Total Potongan: %s", formatRupiah(payroll.TotalDeduction)))
	appendSpacer(6)

	appendLine("F2", 12, "Ditanggung Perusahaan")
	appendLine("F1", 11, fmt.Sprintf("BPJS Employer: %s", formatRupiah(payroll.BPJSEmployer)))
	appendSpacer(6)

	appendLine("F2", 13, fmt.Sprintf("Gaji Bersih: %s", formatRupiah(payroll.NetSalary)))
	if payroll.IsPaid && payroll.PaidAt != nil {
		appendLine("F1", 11, fmt.Sprintf("Status: Dibayar (%s)", *payroll.PaidAt))
	} else {
		appendLine("F1", 11, "Status: Belum Dibayar")
	}

	var builder strings.Builder
	builder.WriteString("BT\n")
	for _, line := range lines {
		builder.WriteString(fmt.Sprintf("/%s %d Tf\n", line.Font, line.Size))
		builder.WriteString(fmt.Sprintf("1 0 0 1 50 %.2f Tm\n", line.Y))
		builder.WriteString(fmt.Sprintf("(%s) Tj\n", escapePDFText(line.Text)))
	}
	builder.WriteString("ET\n")

	return builder.String()
}

func buildSinglePagePDF(content string) ([]byte, error) {
	stream := []byte(content)
	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(stream), content),
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
	}

	var out bytes.Buffer
	out.WriteString("%PDF-1.4\n")
	offsets := make([]int, len(objects)+1)

	for i, obj := range objects {
		offsets[i+1] = out.Len()
		out.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", i+1, obj))
	}

	xrefOffset := out.Len()
	out.WriteString(fmt.Sprintf("xref\n0 %d\n", len(objects)+1))
	out.WriteString("0000000000 65535 f \n")
	for i := 1; i <= len(objects); i++ {
		out.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}
	out.WriteString(fmt.Sprintf("trailer\n<< /Size %d /Root 1 0 R >>\n", len(objects)+1))
	out.WriteString(fmt.Sprintf("startxref\n%d\n%%%%EOF", xrefOffset))

	return out.Bytes(), nil
}

func sanitizeFileName(name string) string {
	trimmed := strings.TrimSpace(strings.ToLower(name))
	if trimmed == "" {
		return "pegawai"
	}

	var b strings.Builder
	for _, r := range trimmed {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '-' || r == '_':
			b.WriteRune(r)
		case r == ' ':
			b.WriteRune('-')
		}
	}

	result := strings.Trim(b.String(), "-")
	if result == "" {
		return "pegawai"
	}
	return result
}

func valueOrDash(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}

func escapePDFText(value string) string {
	replacer := strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)")
	return replacer.Replace(value)
}

func formatRupiah(value float64) string {
	negative := value < 0
	absolute := math.Abs(value)
	rounded := int64(math.Round(absolute))
	plain := strconv.FormatInt(rounded, 10)

	if len(plain) <= 3 {
		if negative {
			return fmt.Sprintf("-Rp %s", plain)
		}
		return fmt.Sprintf("Rp %s", plain)
	}

	parts := make([]string, 0, len(plain)/3+1)
	for len(plain) > 3 {
		parts = append([]string{plain[len(plain)-3:]}, parts...)
		plain = plain[:len(plain)-3]
	}
	parts = append([]string{plain}, parts...)
	formatted := strings.Join(parts, ".")

	if negative {
		return fmt.Sprintf("-Rp %s", formatted)
	}
	return fmt.Sprintf("Rp %s", formatted)
}
