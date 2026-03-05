# EKS-ER-PI Application

A comprehensive Human Resources Information System (HRIS) and Point of Sales (POS) application with separated backend and frontend architecture.

## Project Structure

```
/
├── backend/                 # Go (Fiber + GORM) Backend API
│   ├── app/                 # Application modules
│   │   ├── auth/           # Authentication
│   │   ├── employee/       # Employee management
│   │   ├── department/     # Department management
│   │   ├── position/       # Position management
│   │   ├── attendance/     # Attendance tracking
│   │   ├── leave/          # Leave request management
│   │   ├── payroll/         # Payroll management
│   │   ├── dailyreport/    # Daily report management
│   │   ├── product/        # Product management (POS)
│   │   ├── category/       # Category management (POS)
│   │   ├── sale/           # Sale management (POS)
│   │   ├── stock/          # Stock management (POS)
│   │   ├── report/         # Report generation (POS)
│   │   └── user/           # User management
│   ├── config/             # Configuration files
│   ├── entity/              # Database entities
│   ├── helper/              # Helper functions
│   ├── middleware/         # HTTP middlewares
│   ├── route/              # API routes
│   ├── cmd/migrate/        # Database migrations
│   └── main.go             # Entry point
│
└── src/                    # Next.js Frontend (App Router)
    ├── app/                # Next.js pages
    │   ├── (admin)/        # Admin pages (protected)
    │   │   └── admin/
    │   │       ├── products/     # Product management
    │   │       ├── categories/  # Category management
    │   │       ├── stock/       # Stock management
    │   │       ├── reports/     # Report viewing
    │   │       └── users/       # User management
    │   ├── (auth)/         # Auth pages
    │   │   └── login/      # Login page
    │   ├── (hris)/         # HRIS pages (protected)
    │   │   └── hris/
    │   │       ├── employees/   # Employee management
    │   │       ├── attendance/  # Attendance tracking
    │   │       ├── leave/       # Leave requests
    │   │       ├── payroll/     # Payroll management
    │   │       └── daily-report/# Daily reports
    │   ├── (pos)/          # POS pages (protected)
    │   │   └── pos/
    │   │       ├── page.tsx    # POS/Sales
    │   │       └── report/     # Sales reports
    │   ├── layout.tsx      # Root layout
    │   ├── page.tsx        # Home page
    │   └── globals.css     # Global styles
    ├── components/         # React components
    │   ├── admin/          # Admin components
    │   ├── hris/           # HRIS components
    │   ├── pos/            # POS components
    │   └── ui/             # UI components (shadcn)
    ├── hooks/              # Custom React hooks
    └── lib/                # Utilities and API client
```

## Tech Stack

### Backend
- **Go** - Programming language
- **Fiber** - Web framework
- **GORM** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client

## Features

### HRIS Module
- **Employee Management** - Add, edit, view employee profiles
- **Department Management** - Organize employees by department
- **Position Management** - Define job positions
- **Attendance Tracking** - Track employee attendance
- **Leave Management** - Handle leave requests (approve/reject)
- **Payroll Management** - Manage employee payroll
- **Daily Reports** - Employee daily reporting

### POS Module
- **Product Management** - CRUD operations for products
- **Category Management** - Organize products by category
- **Stock Management** - Track inventory (stock in/out)
- **Sales Processing** - Process sales transactions (cash/QRIS)
- **Reports** - View sales and inventory reports

### Admin Module
- **User Management** - Manage system users with roles
- **Full Access** - Complete system control

## User Roles

- **OWNER** - Full access to all features
- **OPS** - Can manage products, categories, view reports
- **CASHIER** - Can only access POS and create sales
- **HR** - Can access HRIS module (employees, attendance, leave, payroll)
- **EMPLOYEE** - Can view own attendance, submit leave requests, submit daily reports

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your database credentials

4. Install dependencies:
```bash
go mod download
```

5. Run database migrations and seed default owner:
```bash
go run cmd/migrate/main.go
```
*Note: This will automatically create an owner account (`admin@admin.com` / `admin123`) if no owner exists.*

6. Run the server:
```bash
go run main.go
```

The API will be available at `http://localhost:4001`

### Frontend Setup

1. Navigate to the project root (where package.json is located):
```bash
cd .
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:4000`

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Positions
- `GET /api/positions` - Get all positions
- `GET /api/positions/:id` - Get position by ID
- `POST /api/positions` - Create position
- `PUT /api/positions/:id` - Update position
- `DELETE /api/positions/:id` - Delete position

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/:id` - Get attendance by ID
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance
- `GET /api/attendance/employee/:employeeId` - Get attendance by employee

### Leave
- `GET /api/leave` - Get all leave requests
- `GET /api/leave/:id` - Get leave request by ID
- `POST /api/leave` - Create leave request
- `PUT /api/leave/:id` - Update leave request (approve/reject)
- `DELETE /api/leave/:id` - Delete leave request

### Payroll
- `GET /api/payroll` - Get all payroll records
- `GET /api/payroll/:id` - Get payroll by ID
- `POST /api/payroll` - Create payroll record
- `PUT /api/payroll/:id` - Update payroll record

### Daily Reports
- `GET /api/daily-reports` - Get all daily reports
- `GET /api/daily-reports/:id` - Get report by ID
- `POST /api/daily-reports` - Create daily report

### Products (POS)
- `GET /api/products` - Get all products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (OWNER, OPS)
- `PUT /api/products/:id` - Update product (OWNER, OPS)
- `DELETE /api/products/:id` - Delete product (OWNER)

### Categories (POS)
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (OWNER, OPS)
- `PUT /api/categories/:id` - Update category (OWNER, OPS)
- `DELETE /api/categories/:id` - Delete category (OWNER)

### Sales (POS)
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales/:id/pay-cash` - Pay with cash
- `POST /api/sales/:id/pay-qris` - Pay with QRIS
- `GET /api/sales/daily-report` - Get daily report

### Stock (POS)
- `GET /api/stock` - Get all stock records
- `GET /api/stock/:id` - Get stock by ID
- `POST /api/stock/in` - Stock in
- `POST /api/stock/out` - Stock out

### Users
- `GET /api/users` - Get all users (OWNER, OPS)
- `GET /api/users/:id` - Get user by ID (OWNER, OPS)
- `POST /api/users` - Create user (OWNER)
- `PUT /api/users/:id` - Update user (OWNER)
- `DELETE /api/users/:id` - Delete user (OWNER)

## License

MIT
