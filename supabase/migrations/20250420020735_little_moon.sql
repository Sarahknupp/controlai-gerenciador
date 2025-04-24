/*
  # Company Registration Schema Update

  1. New Tables
    - `company_documents` - Stores company documents like CNPJ card, inspection reports, etc.
    - `company_partners` - Stores information about company partners/shareholders
    - `partner_documents` - Stores partner-related documents

  2. Changes
    - Added document management capabilities
    - Added partner registration and management
    - Added document categorization and versioning

  3. Security
    - Enabled RLS on all new tables
    - Added policies for authenticated users
*/

-- Create enum for document categories
CREATE TYPE company_document_type AS ENUM (
  'cnpj_card',
  'inspection_report',
  'social_contract',
  'state_registration',
  'municipal_registration',
  'operating_license',
  'fire_department_certificate',
  'environmental_license',
  'health_license',
  'tax_certificates',
  'other'
);

-- Create company documents table
CREATE TABLE company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type company_document_type NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  version integer DEFAULT 1,
  valid_until date,
  is_active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create company partners table
CREATE TABLE company_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text NOT NULL UNIQUE,
  rg text,
  birth_date date NOT NULL,
  nationality text NOT NULL,
  marital_status text NOT NULL,
  profession text NOT NULL,
  address jsonb NOT NULL,
  contact_info jsonb NOT NULL,
  share_percentage decimal(5,2) NOT NULL,
  role text NOT NULL,
  is_administrator boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create partner documents table
CREATE TABLE partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES company_partners(id) NOT NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  valid_until date,
  is_active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON company_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON company_partners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON partner_documents
  FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_company_documents_type ON company_documents(document_type);
CREATE INDEX idx_company_documents_valid_until ON company_documents(valid_until);
CREATE INDEX idx_company_partners_cpf ON company_partners(cpf);
CREATE INDEX idx_partner_documents_partner ON partner_documents(partner_id);