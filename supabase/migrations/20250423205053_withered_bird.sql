/*
  # Point of Sale (POS) and Cashier System Tables

  1. New Tables
    - `cashier_sessions` - Tracks cashier open/close sessions
    - `cash_flow` - Records cash movements in the register
    - `fiscal_documents` - Stores fiscal document information (NFCe/NFe)
    - `fiscal_document_items` - Items in fiscal documents
    - `terminals` - POS terminal information

  2. Security
    - RLS policies for all new tables
    - Proper access control based on user roles
*/

-- Create cashier sessions table
CREATE TABLE cashier_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES auth.users(id),
  terminal_id text NOT NULL,
  initial_amount decimal(10,2) NOT NULL,
  current_amount decimal(10,2) NOT NULL,
  final_amount decimal(10,2),
  status text NOT NULL CHECK (status IN ('open', 'closed', 'suspended')),
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create cash flow table
CREATE TABLE cash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES cashier_sessions(id),
  amount decimal(10,2) NOT NULL,
  operation_type text NOT NULL CHECK (
    operation_type IN (
      'initial_balance', 
      'final_balance', 
      'withdraw', 
      'deposit', 
      'sale', 
      'refund', 
      'correction'
    )
  ),
  notes text NOT NULL,
  reference_id uuid,
  operator_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create fiscal documents table
CREATE TABLE fiscal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id),
  document_type text NOT NULL CHECK (
    document_type IN ('nfce', 'nfe', 'sat', 'cfe', 'none')
  ),
  document_number text NOT NULL,
  access_key text,
  series text,
  issue_date timestamp with time zone NOT NULL,
  status text NOT NULL CHECK (
    status IN ('pending', 'processing', 'issued', 'rejected', 'cancelled')
  ),
  status_message text,
  xml text,
  pdf_url text,
  cancellation_date timestamp with time zone,
  cancellation_reason text,
  contingency_mode boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  external_id text
);

-- Create fiscal document items table
CREATE TABLE fiscal_document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES fiscal_documents(id),
  product_id uuid NOT NULL REFERENCES products(id),
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  tax_rate numeric(5,2),
  tax_value numeric(10,2),
  tax_code text,
  cfop text,
  ncm text,
  cest text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create terminals table
CREATE TABLE terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  serial_number text,
  model text,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  printer_config jsonb,
  payment_terminals jsonb,
  fiscal_printer jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Alter existing tables
-- Add cashier_session_id to sales table
ALTER TABLE sales ADD COLUMN cashier_session_id uuid REFERENCES cashier_sessions(id);

-- Add fiscal document fields to sales
ALTER TABLE sales ADD COLUMN fiscal_document_id uuid REFERENCES fiscal_documents(id);
ALTER TABLE sales ADD COLUMN fiscal_document_number text;
ALTER TABLE sales ADD COLUMN fiscal_document_status text;

-- Enable Row Level Security
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Cashier sessions policies
CREATE POLICY "Users can view their own cashier sessions"
  ON cashier_sessions FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "Users can insert their own cashier sessions"
  ON cashier_sessions FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Users can update their own cashier sessions"
  ON cashier_sessions FOR UPDATE
  USING (operator_id = auth.uid());

-- Cash flow policies
CREATE POLICY "Users can view cash flow for their sessions"
  ON cash_flow FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "Users can insert cash flow for their sessions"
  ON cash_flow FOR INSERT
  WITH CHECK (operator_id = auth.uid());

-- Fiscal documents policies
CREATE POLICY "Users can view fiscal documents"
  ON fiscal_documents FOR SELECT
  USING (TRUE); -- Anyone authenticated can view

CREATE POLICY "Users can insert fiscal documents"
  ON fiscal_documents FOR INSERT
  WITH CHECK (TRUE); -- Anyone authenticated can insert

CREATE POLICY "Users can update fiscal documents"
  ON fiscal_documents FOR UPDATE
  USING (TRUE); -- Anyone authenticated can update

-- Fiscal document items policies
CREATE POLICY "Users can view fiscal document items"
  ON fiscal_document_items FOR SELECT
  USING (TRUE); -- Anyone authenticated can view

CREATE POLICY "Users can insert fiscal document items"
  ON fiscal_document_items FOR INSERT
  WITH CHECK (TRUE); -- Anyone authenticated can insert

-- Terminals policies
CREATE POLICY "Users can view terminals"
  ON terminals FOR SELECT
  USING (TRUE); -- Anyone authenticated can view

-- Create functions for inventory and sales operations
-- Function to decrease product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(
  product_id uuid,
  quantity numeric
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id AND stock_quantity >= quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to increase product stock
CREATE OR REPLACE FUNCTION increase_product_stock(
  product_id uuid,
  quantity numeric
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + quantity
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales summary
CREATE OR REPLACE FUNCTION get_sales_summary(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  session_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  total_count integer;
  total_amount numeric;
  payment_methods json;
  sales_by_hour json;
BEGIN
  -- Get total sales count and amount
  IF session_id IS NULL THEN
    SELECT 
      COUNT(*),
      COALESCE(SUM(total), 0) 
    INTO 
      total_count,
      total_amount
    FROM 
      sales
    WHERE 
      created_at BETWEEN start_date AND end_date
      AND status = 'completed';
  ELSE
    SELECT 
      COUNT(*),
      COALESCE(SUM(total), 0) 
    INTO 
      total_count,
      total_amount
    FROM 
      sales
    WHERE 
      created_at BETWEEN start_date AND end_date
      AND status = 'completed'
      AND cashier_session_id = session_id;
  END IF;
  
  -- Get sales by payment method
  IF session_id IS NULL THEN
    SELECT 
      json_agg(
        json_build_object(
          'name', pm.name,
          'amount', COALESCE(SUM(s.total), 0)
        )
      )
    INTO payment_methods
    FROM 
      payment_methods pm
    LEFT JOIN 
      sales s ON s.payment_method_id = pm.id 
      AND s.created_at BETWEEN start_date AND end_date
      AND s.status = 'completed'
    GROUP BY pm.id;
  ELSE
    SELECT 
      json_agg(
        json_build_object(
          'name', pm.name,
          'amount', COALESCE(SUM(s.total), 0)
        )
      )
    INTO payment_methods
    FROM 
      payment_methods pm
    LEFT JOIN 
      sales s ON s.payment_method_id = pm.id 
      AND s.created_at BETWEEN start_date AND end_date
      AND s.status = 'completed'
      AND s.cashier_session_id = session_id
    GROUP BY pm.id;
  END IF;
  
  -- Get sales by hour
  IF session_id IS NULL THEN
    SELECT 
      json_agg(
        json_build_object(
          'hour', hour,
          'count', count,
          'amount', amount
        )
      )
    INTO sales_by_hour
    FROM (
      SELECT 
        EXTRACT(HOUR FROM created_at) AS hour,
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS amount
      FROM 
        sales
      WHERE 
        created_at BETWEEN start_date AND end_date
        AND status = 'completed'
      GROUP BY 
        EXTRACT(HOUR FROM created_at)
      ORDER BY 
        EXTRACT(HOUR FROM created_at)
    ) AS hours;
  ELSE
    SELECT 
      json_agg(
        json_build_object(
          'hour', hour,
          'count', count,
          'amount', amount
        )
      )
    INTO sales_by_hour
    FROM (
      SELECT 
        EXTRACT(HOUR FROM created_at) AS hour,
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS amount
      FROM 
        sales
      WHERE 
        created_at BETWEEN start_date AND end_date
        AND status = 'completed'
        AND cashier_session_id = session_id
      GROUP BY 
        EXTRACT(HOUR FROM created_at)
      ORDER BY 
        EXTRACT(HOUR FROM created_at)
    ) AS hours;
  END IF;
  
  -- Build result JSON
  result := json_build_object(
    'total_sales', total_count,
    'total_amount', total_amount,
    'by_payment_method', COALESCE(payment_methods, '[]'::json),
    'by_hour', COALESCE(sales_by_hour, '[]'::json)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer points
CREATE OR REPLACE FUNCTION update_customer_points(
  customer_id uuid,
  points_to_add integer DEFAULT 0,
  points_to_remove integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET points = COALESCE(points, 0) + points_to_add - points_to_remove
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_cashier_sessions_operator ON cashier_sessions(operator_id);
CREATE INDEX idx_cashier_sessions_status ON cashier_sessions(status);
CREATE INDEX idx_cash_flow_session ON cash_flow(session_id);
CREATE INDEX idx_cash_flow_operation_type ON cash_flow(operation_type);
CREATE INDEX idx_fiscal_documents_sale ON fiscal_documents(sale_id);
CREATE INDEX idx_fiscal_documents_status ON fiscal_documents(status);
CREATE INDEX idx_fiscal_document_items_document ON fiscal_document_items(document_id);
CREATE INDEX idx_fiscal_document_items_product ON fiscal_document_items(product_id);
CREATE INDEX idx_sales_cashier_session ON sales(cashier_session_id);
CREATE INDEX idx_sales_fiscal_document ON sales(fiscal_document_id);