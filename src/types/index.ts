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
  imei1?: string;
  imei2?: string;
  total_price: number;
  down_payment: number;
  loan_amount: number;
  tenure: number;
  interest_rate: number;
  emi_amount: number;
  start_date: string;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
  customer?: { name: string; mobile: string };
  purchase_images?: { image_url: string }[];
  processing_fee?: number;
  tds_amount?: number;
  insurance_amount?: number;
  documentation_charges?: number;
  other_charges?: number;
}

// Detailed EMI schedule row used across the app
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
  late_fee?: number;
  created_at?: string;
}

export interface EMI {
  id: string;
  purchase_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Setting {
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

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  caption?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  offer_price?: number;
  is_offer?: boolean;
  created_at?: string;
  updated_at?: string;
  product_images?: ProductImage[];
}

export interface CustomerOTP {
  id: string;
  mobile: string;
  otp: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}
