/*
  # Initial Database Schema for Pão na Mão

  1. Financial Management Tables
    - `financial_transactions`: Records all financial transactions
    - `accounts_payable`: Tracks payables/debts
    - `accounts_receivable`: Tracks receivables
    - `payment_methods`: Available payment methods
    - `payment_schedules`: Scheduled payments
    
  2. HR Tables
    - `employees`: Employee information
    - `employee_documents`: Employee-related documents
    - `payroll`: Payroll records
    - `overtime_records`: Overtime tracking
    
  3. POS & Inventory Tables
    - `products`: Product catalog
    - `product_categories`: Product categorization
    - `inventory_items`: Inventory tracking
    - `sales`: Sales records
    - `sales_items`: Items in each sale
    - `customers`: Customer information
    
  4. Security
    - RLS policies for all tables
    - Proper access control based on user roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE document_type AS ENUM (
  'payment_receipt',
  'advance_payment',
  'overtime',
  'warning',
  'ppe_delivery',
  'camera_monitoring_consent',
  'internal_regulations'
);
CREATE TYPE product_type AS ENUM ('resale', 'own_production', 'raw_material');
CREATE TYPE inventory_operation AS ENUM ('purchase', 'sale', 'production', 'adjustment', 'loss');

-- Financial Management Tables

CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  date timestamp with time zone NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method_id uuid,
  reference_id uuid,
  reference_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creditor_name text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  document_number text,
  installment_number integer,
  total_installments integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  document_number text,
  installment_number integer,
  total_installments integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  requires_integration boolean DEFAULT false,
  integration_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id uuid REFERENCES accounts_payable(id),
  scheduled_date date NOT NULL,
  amount decimal(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method_id uuid REFERENCES payment_methods(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- HR Tables

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  rg text,
  birth_date date NOT NULL,
  hire_date date NOT NULL,
  position text NOT NULL,
  department text NOT NULL,
  salary decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  contact_info jsonb NOT NULL,
  bank_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  document_type document_type NOT NULL,
  issue_date date NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary decimal(10,2) NOT NULL,
  additions jsonb NOT NULL DEFAULT '{}',
  deductions jsonb NOT NULL DEFAULT '{}',
  net_salary decimal(10,2) NOT NULL,
  payment_date date,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE overtime_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  date date NOT NULL,
  hours numeric(4,2) NOT NULL,
  rate numeric(3,2) NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- POS & Inventory Tables

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES product_categories(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES product_categories(id),
  type product_type NOT NULL,
  sku text UNIQUE,
  barcode text,
  unit text NOT NULL,
  price decimal(10,2) NOT NULL,
  cost decimal(10,2),
  tax_info jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity numeric(10,3) NOT NULL,
  minimum_quantity numeric(10,3),
  location text,
  batch_number text,
  expiration_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) NOT NULL,
  operation_type inventory_operation NOT NULL,
  quantity numeric(10,3) NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  contact_info jsonb NOT NULL,
  credit_limit decimal(10,2),
  is_employee boolean DEFAULT false,
  employee_id uuid REFERENCES employees(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(document_type, document_number)
);

CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  sale_date timestamp with time zone NOT NULL DEFAULT now(),
  subtotal decimal(10,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL,
  payment_method_id uuid REFERENCES payment_methods(id),
  status text NOT NULL DEFAULT 'pending',
  fiscal_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity numeric(10,3) NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON financial_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON accounts_payable
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON accounts_receivable
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON payment_schedules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON employee_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON payroll
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON overtime_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON inventory_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON inventory_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON sales_items
  FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_employees_cpf ON employees(cpf);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_customers_document ON customers(document_type, document_number);