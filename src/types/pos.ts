// Cashier Session Types
export type CashierSessionStatus = 'open' | 'closed' | 'suspended';

export interface CashierSession {
  id: string;
  operator_id: string;
  terminal_id: string;
  initial_amount: number;
  current_amount: number;
  final_amount?: number;
  status: CashierSessionStatus;
  opened_at: string;
  closed_at: string | null;
  notes: string;
}

export type CashierOperationType = 'initial_balance' | 'final_balance' | 'withdraw' | 'deposit' | 'sale' | 'refund' | 'correction';

export interface CashFlow {
  id: string;
  session_id: string;
  amount: number;
  operation_type: CashierOperationType;
  notes: string;
  reference_id?: string;
  operator_id: string;
  created_at: string;
  operators?: {
    name: string;
  };
}

export interface CashierSummary {
  sessionId: string;
  openedAt: string;
  initialAmount: number;
  currentAmount: number;
  totalSales: number;
  salesCount: number;
  paymentMethods: {
    name: string;
    amount: number;
  }[];
  withdrawals: number;
  deposits: number;
  expectedCashAmount: number;
  difference: number;
}

// Payment Types
export type PaymentMethod = 
  'credit' | 
  'debit' | 
  'cash' | 
  'pix' | 
  'voucher_food' | 
  'voucher_meal' | 
  'store_credit' | 
  'transfer' |
  'check' |
  'other';

export type PaymentStatus = 'pending' | 'authorized' | 'completed' | 'declined' | 'cancelled' | 'refunded';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  integration?: {
    provider?: string;
    transaction_id?: string;
    authorization_code?: string;
    installments?: number;
    card_brand?: string;
    card_last_digits?: string;
  };
  received_amount?: number;
  change_amount?: number;
  notes?: string;
}

// Product & Inventory Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  category_id: string;
  barcode?: string;
  unit: string;
  tax_rate: number;
  tax_code: string;
  stock_quantity: number;
  min_stock_quantity: number;
  is_active: boolean;
  is_service: boolean;
  allow_fractions: boolean;
  image_url?: string;
  fiscal_data: {
    ncm: string;
    cest?: string;
    cfop: string;
    origin: string;
    icms_rate: number;
    pis_rate: number;
    cofins_rate: number;
    ipi_rate: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
}

// Sale Types
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'returned';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  tax_rate: number;
  tax_amount: number;
  notes?: string;
  product?: Product;
  returned_quantity?: number;
}

export interface Sale {
  id: string;
  customer_id?: string;
  operator_id: string;
  terminal_id: string;
  cashier_session_id: string;
  subtotal: number;
  discount_amount: number;
  discount_type?: 'percentage' | 'value' | 'points' | 'coupon';
  discount_reason?: string;
  tax_amount: number;
  total: number;
  status: SaleStatus;
  payment_details: PaymentDetails[];
  fiscal_document_id?: string;
  fiscal_document_number?: string;
  fiscal_document_status?: 'pending' | 'issued' | 'rejected' | 'cancelled';
  external_reference?: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  notes?: string;
  items?: SaleItem[];
  customer?: {
    name: string;
    document?: string;
  };
}

// Fiscal Document Types
export type FiscalDocumentType = 'nfce' | 'nfe' | 'sat' | 'cfe' | 'none';
export type FiscalDocumentStatus = 'pending' | 'processing' | 'issued' | 'rejected' | 'cancelled';

export interface FiscalDocument {
  id: string;
  sale_id: string;
  document_type: FiscalDocumentType;
  document_number: string;
  access_key?: string;
  series?: string;
  issue_date: string;
  status: FiscalDocumentStatus;
  status_message?: string;
  xml?: string;
  pdf_url?: string;
  cancellation_date?: string;
  cancellation_reason?: string;
  contingency_mode: boolean;
  created_at: string;
  updated_at: string;
  external_id?: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  document_type: 'cpf' | 'cnpj' | 'foreign';
  document_number?: string;
  email?: string;
  phone?: string;
  address?: CustomerAddress;
  points?: number;
  discount_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Terminal & Device Types
export interface Terminal {
  id: string;
  name: string;
  serial_number: string;
  model?: string;
  location?: string;
  is_active: boolean;
  printer_config?: {
    type: 'thermal' | 'laser' | 'inkjet' | 'none';
    connection: 'usb' | 'network' | 'bluetooth' | 'serial';
    address?: string;
    paper_width?: number;
    paper_height?: number;
    dpi?: number;
    auto_cut?: boolean;
  };
  payment_terminals?: {
    provider: string;
    id: string;
    model?: string;
    connection?: string;
  }[];
  fiscal_printer?: {
    type: 'sat' | 'nfce' | 'none';
    serial_number?: string;
    activation_code?: string;
  };
}