export interface Customer {
  id: string;
  name: string;
  mobile: string;
  aadhaar?: string;
  pan?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  customer_id: string;
  product_name: string;
  total_price: number;
  down_payment: number;
  loan_amount: number;
  tenure: 6 | 12;
  interest_rate: number;
  emi_amount: number;
  start_date: string;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface EMISchedule {
  id: string;
  purchase_id: string;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
  late_fee: number;
  created_at: string;
}

export interface Payment {
  id: string;
  emi_schedule_id: string;
  purchase_id: string;
  customer_id: string;
  amount_paid: number;
  late_fee: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  customer_id: string;
  mobile: string;
  message: string;
  sms_type: string;
  status: 'sent' | 'failed' | 'pending';
  response?: string;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  active_loans: number;
  overdue_payments: number;
  total_outstanding: number;
  monthly_collections: number;
}

export interface CustomerOTP {
  id: string;
  mobile: string;
  otp: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}