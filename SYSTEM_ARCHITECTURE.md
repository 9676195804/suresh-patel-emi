# System Architecture & Flow

## 🏗️ Application Structure

```
Suresh Patel Kirana EMI System
├── Frontend (React + TypeScript + Tailwind)
├── Backend (Supabase PostgreSQL + Auth)
├── SMS Service (HttpSMS API)
└── Automated Scheduler (Daily Reminders)
```

## 📊 Data Flow Diagram

### SMS Send Flow

```
User Action (Settings Page)
    ↓
[Click "Send Test SMS"]
    ↓
Validate Phone Number (+country code)
    ↓
Get Settings from Database
    ├─→ API Key exists? → YES → Continue
    └─→ NO → Demo Mode → Log to DB → Stop
    ↓
Prepare HttpSMS Request
    ├─→ from: +919293184021
    ├─→ to: User's phone
    └─→ content: Message text
    ↓
POST https://api.httpsms.com/v1/messages/send
    ├─→ Headers: x-api-key, Content-Type, Accept
    └─→ Body: {from, to, content}
    ↓
Receive Response
    ├─→ HTTP 200 → Success
    └─→ HTTP 4xx/5xx → Error
    ↓
Parse Response JSON
    ↓
Log to sms_logs Table
    ├─→ customer_id
    ├─→ mobile
    ├─→ message
    ├─→ sms_type
    ├─→ status (sent/failed)
    └─→ response (API response)
    ↓
Return Result to User
    ├─→ Success: Show message ID
    └─→ Error: Show details & troubleshooting
```

## 🔐 Authentication Flow

```
User Opens App
    ↓
Select Portal Type
    ├─→ Admin Portal
    │   ↓
    │   Admin Login Form
    │   ↓
    │   Try Supabase Auth (username@admin.local + password)
    │   ├─→ Success → Get JWT token → Continue
    │   └─→ Fail → Fallback to direct DB query
    │       ↓
    │       Verify password_hash
    │       ↓
    │       Store in localStorage
    │       ↓
    │       Admin Dashboard
    │
    └─→ Customer Portal
        ↓
        Customer Login Form (Mobile + Password)
        ↓
        Query customers table
        ↓
        Verify password
        ↓
        Store in localStorage
        ↓
        Customer Dashboard
```

## 🗄️ Database Schema

### Core Tables

```sql
admin_users
├── id (uuid, primary key)
├── username (text, unique)
├── password_hash (text)
├── email (text, unique)
└── created_at (timestamptz)

customers
├── id (uuid, primary key)
├── name (text)
├── mobile (text, unique)
├── email (text)
├── address (text)
├── aadhar_number (text)
├── password (text)
└── created_at (timestamptz)

purchases
├── id (uuid, primary key)
├── customer_id (uuid, foreign key)
├── product_name (text)
├── total_price (numeric)
├── down_payment (numeric)
├── loan_amount (numeric)
├── interest_rate (numeric)
├── tenure_months (integer)
├── emi_amount (numeric)
├── status (text)
├── purchase_date (date)
└── created_at (timestamptz)

emi_schedule
├── id (uuid, primary key)
├── purchase_id (uuid, foreign key)
├── installment_number (integer)
├── due_date (date)
├── emi_amount (numeric)
├── principal_amount (numeric)
├── interest_amount (numeric)
├── late_fee (numeric)
├── total_amount (numeric)
├── status (text)
└── created_at (timestamptz)

payments
├── id (uuid, primary key)
├── customer_id (uuid, foreign key)
├── purchase_id (uuid, foreign key)
├── emi_id (uuid, foreign key)
├── amount_paid (numeric)
├── payment_date (date)
├── payment_method (text)
└── created_at (timestamptz)

settings
├── key (text, primary key)
├── value (text)
└── updated_at (timestamptz)

sms_logs
├── id (uuid, primary key)
├── customer_id (uuid, foreign key, nullable)
├── mobile (text)
├── message (text)
├── sms_type (text)
├── status (text)
├── response (text)
└── created_at (timestamptz)
```

## 🔒 RLS Policies

### Authenticated Admin Users Can:
```
✅ SELECT from all tables
✅ INSERT into all tables
✅ UPDATE all tables
✅ DELETE from all tables
```

### Anonymous Users (Customers) Can:
```
✅ SELECT own customer data
✅ SELECT own purchases
✅ SELECT own EMI schedule
✅ SELECT own payments
❌ No access to settings
❌ No access to sms_logs
❌ No access to other customers' data
```

## 🎯 Component Architecture

```
App.tsx (Root)
├── Navigation
│   ├── Logo & Title
│   ├── Menu Items (Dynamic by user type)
│   └── Logout Button
│
├── Admin Portal
│   ├── AdminLogin
│   ├── AdminDashboard
│   │   ├── Stats Cards
│   │   └── Quick Actions
│   ├── CustomerManagement
│   │   ├── Customer List
│   │   ├── Add Customer Form
│   │   └── Edit Customer Modal
│   ├── PurchaseManagement
│   │   ├── Purchase List
│   │   ├── Add Purchase Form
│   │   └── EMI Schedule Display
│   ├── PaymentManagement
│   │   ├── Payment List
│   │   ├── Record Payment Form
│   │   └── Payment History
│   ├── Settings
│   │   ├── Business Settings
│   │   ├── HttpSMS Configuration
│   │   ├── SMS Templates
│   │   ├── Test SMS
│   │   └── Trigger Reminders
│   └── SMSLogs ⭐ NEW
│       ├── Filter Controls
│       ├── Search Bar
│       ├── Log List
│       └── Detail Modal
│
└── Customer Portal
    └── CustomerDashboard
        ├── Welcome Card
        ├── Active Purchases
        ├── EMI Schedule
        └── Payment History
```

## 🔄 SMS Automation Flow

### Daily Reminder Job (9:00 AM)
```
Scheduler Triggers
    ↓
Get Tomorrow's Date
    ↓
Query emi_schedule for EMIs due tomorrow
    ├─→ status = 'pending'
    └─→ due_date = tomorrow
    ↓
For Each EMI:
    ├─→ Get Customer Details
    ├─→ Get Shop Name from Settings
    ├─→ Build Reminder Message
    └─→ Send SMS via HttpSMS
        ↓
        Log Result to sms_logs
    ↓
Log Completion (X reminders sent)
```

### Overdue Check Job (10:00 AM)
```
Scheduler Triggers
    ↓
Get Today's Date
    ↓
Query emi_schedule for Overdue EMIs
    ├─→ status = 'pending'
    └─→ due_date < today
    ↓
For Each Overdue EMI:
    ├─→ Calculate Days Overdue
    ├─→ Calculate Late Fee
    ├─→ Get Customer Details
    ├─→ Build Overdue Notice
    └─→ Send SMS via HttpSMS
        ↓
        Log Result to sms_logs
    ↓
Log Completion (X notices sent)
```

## 📱 SMS Types & Triggers

| Type | When Triggered | Variables Used |
|------|---------------|----------------|
| **test** | Manual from Settings | None (custom message) |
| **purchase_welcome** | New purchase created | customer_name, product_name, total_price, emi_amount, tenure, first_due_date, shop_name |
| **payment_confirmation** | Payment recorded | customer_name, emi_amount, installment_number, remaining_installments, shop_name |
| **payment_reminder** | 1 day before due | customer_name, emi_amount, due_date, shop_name |
| **overdue_notice** | After due date | customer_name, emi_amount, late_fee, shop_name |
| **noc** | All EMIs paid | customer_name, product_name, shop_name |

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

### Backend
- **Supabase** - PostgreSQL database
- **Supabase Auth** - Authentication
- **Row Level Security** - Data protection

### External Services
- **HttpSMS API** - SMS delivery
  - Endpoint: `https://api.httpsms.com/v1/messages/send`
  - Auth: API key in `x-api-key` header
  - Format: JSON with from/to/content

## 🔍 Monitoring & Debugging

### Browser Console Logs
```javascript
// Settings Save
"Starting to save settings..."
"Saving setting: sms_api_key"
"Successfully saved: sms_api_key"
"All 10 settings saved successfully!"

// SMS Send
"=== Starting Test SMS ==="
"Sending TEST SMS via HttpSMS API..."
"HttpSMS API Response Status: 200"
"=== Test SMS Result ==="
```

### SMS Logs Database
```sql
SELECT
    id,
    mobile,
    sms_type,
    status,
    created_at,
    response
FROM sms_logs
ORDER BY created_at DESC
LIMIT 100;
```

### SMS Logs UI
- Real-time view of all SMS attempts
- Filter by status
- Search by content
- Click for detailed API response
- Color-coded by type

## 🚦 Error Handling Levels

1. **User Level**
   - Alert messages with clear descriptions
   - Suggested troubleshooting steps
   - Links to relevant documentation

2. **Console Level**
   - Detailed request/response logs
   - Error stack traces
   - Debug information

3. **Database Level**
   - All attempts logged in sms_logs
   - Failed messages with error details
   - Audit trail for compliance

4. **Application Level**
   - Try-catch blocks around all operations
   - Graceful degradation (demo mode)
   - Fallback authentication

## 📈 Performance Considerations

### Database Queries
- Indexed columns: mobile, email, due_date
- Limit result sets (100 logs max)
- Use maybeSingle() for single records

### API Calls
- Timeout handling
- Retry logic for transient failures
- Rate limiting awareness

### Frontend
- Lazy loading components
- Optimized bundle size (~360KB)
- Minimal re-renders

## 🔐 Security Features

1. **Authentication**
   - JWT tokens via Supabase Auth
   - Secure session storage
   - Proper logout cleanup

2. **Authorization**
   - RLS policies on all tables
   - Role-based access (admin/customer)
   - No direct database access

3. **Data Protection**
   - API keys masked in logs
   - Passwords never exposed
   - HTTPS-only communication

4. **Input Validation**
   - Phone number format checks
   - Required field validation
   - SQL injection prevention (Supabase)

## 📚 Further Reading

- `QUICK_START.md` - Fast testing guide
- `HTTPSMS_SETUP.md` - Detailed setup instructions
- `IMPROVEMENTS_SUMMARY.md` - All changes made
