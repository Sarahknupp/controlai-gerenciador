/**
 * Tipos para APIs de automação e integração no módulo de vendas
 */

// Tipos para API de Análise de Vendas
export interface SalesMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend?: number;
  targetValue?: number;
  status: 'success' | 'warning' | 'danger' | 'info';
  period?: string;
}

export interface SalesChart {
  id: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  data: Array<Record<string, any>>;
  categories?: string[];
  series?: Array<{
    name: string;
    data: number[];
  }>;
  options?: Record<string, any>;
}

export interface SalesDashboardData {
  metrics: SalesMetric[];
  charts: SalesChart[];
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    total: number;
    percentage: number;
  }[];
  topCustomers: {
    id: string;
    name: string;
    purchases: number;
    total: number;
    lastPurchase: string;
  }[];
  recentSales: {
    id: string;
    date: string;
    customer: string;
    total: number;
    items: number;
    status: string;
  }[];
}

export interface SalesReportParams {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: {
    productIds?: string[];
    categoryIds?: string[];
    customerIds?: string[];
    paymentMethods?: string[];
  };
}

export interface SalesAlertConfig {
  id: string;
  metricId: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  channels: ('email' | 'sms' | 'push' | 'system')[];
  recipients: string[];
  active: boolean;
  message: string;
}

// Tipos para API de Importação de Documentos Fiscais
export interface FiscalDocumentImport {
  id: string;
  sourceType: 'xml' | 'json' | 'api';
  sourceFile?: string;
  sourceUrl?: string;
  documentType: 'nfe' | 'nfce' | 'cte' | 'mdfe' | 'other';
  documentNumber: string;
  documentKey?: string;
  documentDate: string;
  issuerName: string;
  issuerDocument: string;
  totalValue: number;
  status: 'pending' | 'processing' | 'validated' | 'imported' | 'error';
  errorDetails?: string[];
  items: FiscalDocumentItem[];
  processingDate?: string;
  importDate?: string;
  updatedInventory: boolean;
  updatedFinancial: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalDocumentItem {
  id: string;
  documentImportId: string;
  productCode: string;
  productDescription: string;
  quantity: number;
  unit: string;
  unitValue: number;
  totalValue: number;
  ncm?: string;
  cfop?: string;
  cest?: string;
  matchedProductId?: string;
  matchConfidence?: number;
  status: 'pending' | 'matched' | 'created' | 'error';
  errorDetails?: string;
}

export interface FiscalDocumentValidationResult {
  isValid: boolean;
  documentKey?: string;
  documentNumber?: string;
  issueDate?: string;
  errors: {
    code: string;
    message: string;
    field?: string;
  }[];
  warnings: {
    code: string;
    message: string;
    field?: string;
  }[];
}

// Tipos para API de OCR para Documentos Não Fiscais
export interface OcrDocument {
  id: string;
  sourceType: 'image' | 'pdf';
  sourceFile: string;
  documentType: 'receipt' | 'invoice' | 'bill' | 'other';
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  confidence: number;
  extractedData: OcrExtractedData;
  rawText?: string;
  errorDetails?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OcrExtractedData {
  issuer?: {
    name?: string;
    document?: string;
    address?: string;
  };
  recipient?: {
    name?: string;
    document?: string;
    address?: string;
  };
  documentInfo?: {
    type?: string;
    number?: string;
    date?: string;
    dueDate?: string;
  };
  items?: OcrExtractedItem[];
  totals?: {
    subtotal?: number;
    tax?: number;
    discount?: number;
    shipping?: number;
    total?: number;
  };
  paymentInfo?: {
    method?: string;
    installments?: number;
    cardInfo?: string;
  };
  metadata?: Record<string, any>;
}

export interface OcrExtractedItem {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
  unitValue?: number;
  totalValue?: number;
  matchedProductId?: string;
  matchConfidence?: number;
}

export interface OcrProcessingResult {
  success: boolean;
  documentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  extractedData?: OcrExtractedData;
  createdDebt?: boolean;
  updatedInventory?: boolean;
}

// Tipos para Configurações das APIs
export interface ApiConfiguration {
  id: string;
  apiName: 'sales-analytics' | 'document-import' | 'ocr';
  enabled: boolean;
  rateLimiting: {
    maxRequests: number;
    timeWindow: number; // in seconds
  };
  caching: {
    enabled: boolean;
    ttl: number; // in seconds
  };
  authentication: {
    method: 'oauth2' | 'api-key' | 'jwt' | 'basic';
    keys?: string[];
    scopes?: string[];
  };
  webhooks?: {
    url: string;
    events: string[];
    secret?: string;
  }[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}