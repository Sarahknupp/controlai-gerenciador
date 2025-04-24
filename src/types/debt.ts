export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'renegotiated' | 'cancelled';

export interface DebtCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  debtor_name: string;
  amount: number;
  due_date: string;
  category_id: string;
  description?: string;
  status: DebtStatus;
  notes?: string;
  document_number?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  payment_info?: {
    payment_method?: string;
    bank_details?: string;
    installments?: number;
  };
  recurring: boolean;
  recurrence_info?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    day?: number;
    end_date?: string;
    times?: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface DebtAttachment {
  id: string;
  debt_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_path: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface DebtReport {
  id: string;
  name: string;
  description?: string;
  filters?: {
    status?: DebtStatus[];
    category_ids?: string[];
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    debtors?: string[];
  };
  columns?: string[];
  sort_options?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DebtFormData {
  debtor_name: string;
  amount: number | string;
  due_date: string;
  category_id: string;
  description?: string;
  status: DebtStatus;
  notes?: string;
  document_number?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  payment_info?: {
    payment_method?: string;
    bank_details?: string;
    installments?: number;
  };
  recurring: boolean;
  recurrence_info?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    day?: number | string;
    end_date?: string;
    times?: number | string;
  };
}

export interface DebtFilterOptions {
  status?: DebtStatus[];
  category_ids?: string[];
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  debtors?: string[];
  search_term?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface DebtSummary {
  total_count: number;
  total_amount: number;
  pending_amount: number;
  overdue_amount: number;
  paid_amount: number;
  overdue_count: number;
  pending_count: number;
  paid_count: number;
  by_category: {
    category_id: string;
    category_name: string;
    total_amount: number;
    count: number;
  }[];
  by_month: {
    month: string;
    amount: number;
    count: number;
  }[];
}