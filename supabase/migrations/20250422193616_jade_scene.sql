/*
  # Sistema de Gerenciamento de Dívidas

  1. Novas Tabelas
    - `debts` - Armazena informações sobre dívidas registradas
    - `debt_categories` - Categorias para classificação de dívidas
    - `debt_payments` - Registros de pagamentos relacionados às dívidas
    - `debt_attachments` - Arquivos e anexos relacionados às dívidas
    - `debt_reports` - Relatórios salvos para reutilização

  2. Funcionalidades
    - Registro completo de dívidas
    - Categorização de dívidas
    - Acompanhamento de pagamentos
    - Anexos de arquivos (contratos, comprovantes)
    - Geração de relatórios personalizados

  3. Segurança
    - RLS para controle de acesso
    - Políticas para cada tabela
*/

-- Create enum types for debt status and payment methods
CREATE TYPE debt_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'renegotiated', 'cancelled');

-- Create debt categories table
CREATE TABLE debt_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create debts table
CREATE TABLE debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_name text NOT NULL,
  amount decimal(12,2) NOT NULL,
  due_date date NOT NULL,
  category_id uuid REFERENCES debt_categories(id),
  description text,
  status debt_status NOT NULL DEFAULT 'pending',
  notes text,
  document_number text,
  contact_info jsonb,
  payment_info jsonb,
  recurring boolean DEFAULT false,
  recurrence_info jsonb,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Create debt payments table
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) NOT NULL,
  amount decimal(12,2) NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  receipt_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create debt attachments table
CREATE TABLE debt_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debts(id) NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  file_path text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create debt reports table for saved report configurations
CREATE TABLE debt_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filters jsonb,
  columns jsonb,
  sort_options jsonb,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default categories
INSERT INTO debt_categories (name, description, color, icon) VALUES
('Empréstimos', 'Empréstimos bancários, financiamentos e similares', '#4F46E5', 'landmark'),
('Cartões de Crédito', 'Faturas de cartões de crédito', '#F97316', 'credit-card'),
('Fornecedores', 'Contas a pagar para fornecedores', '#059669', 'truck'),
('Impostos', 'Impostos, taxas e obrigações fiscais', '#DC2626', 'landmark'),
('Serviços', 'Serviços contratados e utilidades', '#8B5CF6', 'wrench'),
('Salários', 'Folha de pagamento e benefícios', '#0EA5E9', 'users'),
('Aluguéis', 'Aluguéis e arrendamentos', '#EC4899', 'building'),
('Outros', 'Outras dívidas e obrigações', '#71717A', 'more-horizontal');

-- Enable row level security
ALTER TABLE debt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated users" ON debt_categories
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON debts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON debts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for authenticated users" ON debts
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for authenticated users" ON debts
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable read access for authenticated users" ON debt_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON debt_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable read access for authenticated users" ON debt_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON debt_attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete access for authenticated users" ON debt_attachments
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable read access for authenticated users" ON debt_reports
  FOR SELECT TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable insert access for authenticated users" ON debt_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for authenticated users" ON debt_reports
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for authenticated users" ON debt_reports
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debts_category_id ON debts(category_id);
CREATE INDEX idx_debts_created_by ON debts(created_by);
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX idx_debt_payments_payment_date ON debt_payments(payment_date);
CREATE INDEX idx_debt_attachments_debt_id ON debt_attachments(debt_id);

-- Create trigger function to update the debt status based on payments
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS TRIGGER AS $$
DECLARE
    total_amount DECIMAL(12,2);
    paid_amount DECIMAL(12,2);
    debt_record debts%ROWTYPE;
BEGIN
    -- Get the debt record
    SELECT * INTO debt_record FROM debts WHERE id = NEW.debt_id;
    
    -- Calculate total paid amount for this debt
    SELECT COALESCE(SUM(amount), 0) INTO paid_amount 
    FROM debt_payments 
    WHERE debt_id = NEW.debt_id;
    
    -- Get the total amount of the debt
    total_amount := debt_record.amount;
    
    -- Update debt status based on payment amount
    IF paid_amount >= total_amount THEN
        UPDATE debts SET status = 'paid', updated_at = NOW() WHERE id = NEW.debt_id;
    ELSIF paid_amount > 0 AND paid_amount < total_amount THEN
        UPDATE debts SET status = 'partial', updated_at = NOW() WHERE id = NEW.debt_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for after insert on debt_payments
CREATE TRIGGER update_debt_status_after_payment
AFTER INSERT ON debt_payments
FOR EACH ROW
EXECUTE FUNCTION update_debt_status();

-- Create function to check for overdue debts
CREATE OR REPLACE FUNCTION check_overdue_debts()
RETURNS VOID AS $$
BEGIN
    UPDATE debts 
    SET status = 'overdue', updated_at = NOW() 
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-backup data
CREATE OR REPLACE FUNCTION backup_debt_data()
RETURNS VOID AS $$
DECLARE
    backup_path TEXT;
    backup_date TEXT;
BEGIN
    backup_date := TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD');
    backup_path := '/tmp/backup_debts_' || backup_date || '.sql';
    
    -- This function would normally use pg_dump in a production environment
    -- For the StackBlitz environment, we'll simply log that a backup would be performed
    RAISE NOTICE 'Backup would be created at: %', backup_path;
END;
$$ LANGUAGE plpgsql;