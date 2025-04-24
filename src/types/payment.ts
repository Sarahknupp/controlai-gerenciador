/**
 * Tipos para o sistema de pagamento integrado
 */

// Métodos de pagamento suportados pelo sistema
export type PaymentMethodType = 
  'pix' |        // Pagamento via PIX
  'cash' |       // Dinheiro
  'credit' |     // Cartão de crédito via TEF
  'debit' |      // Cartão de débito via TEF
  'transfer' |   // Transferência bancária
  'voucher' |    // Vale alimentação/refeição
  'other';       // Outros métodos

// Status de uma transação de pagamento
export type PaymentStatus = 
  'initialized' |  // Pagamento inicializado
  'processing' |   // Processando pagamento
  'approved' |     // Pagamento aprovado
  'denied' |       // Pagamento negado
  'cancelled' |    // Pagamento cancelado
  'refunded' |     // Pagamento estornado
  'pending' |      // Pagamento pendente de confirmação (ex: PIX aguardando)
  'expired';       // Pagamento expirado

// Configuração para impressão de recibos
export interface ReceiptConfig {
  printAutomatically: boolean; // Imprimir automaticamente ao concluir?
  copies: number;             // Número de cópias
  includeLogo: boolean;       // Incluir logo da empresa?
  includeCustomerInfo: boolean; // Incluir dados do cliente?
  emailReceipt: boolean;      // Enviar recibo por email?
}

// Informações da transação de PIX
export interface PixTransactionInfo {
  qrCodeData: string;        // Dados do QR code para exibição
  qrCodeImage?: string;      // Imagem do QR code em base64 (opcional)
  expiresAt: Date;           // Data de expiração
  key: string;               // Chave PIX gerada para a transação
  transactionId: string;     // Identificador da transação PIX
  paymentLinkUrl?: string;   // URL para pagamento (opcional)
}

// Informações da transação de cartão (TEF)
export interface CardTransactionInfo {
  brand?: string;            // Bandeira do cartão (Visa, Mastercard, etc)
  lastDigits?: string;       // Últimos 4 dígitos do cartão
  authorizationCode?: string; // Código de autorização
  nsuHost?: string;          // NSU do host
  nsuLocal?: string;         // NSU local
  installments?: number;     // Número de parcelas (para crédito)
  cardholderName?: string;   // Nome do titular (se disponível)
  receiptData?: string;      // Dados do comprovante para impressão
}

// Informações da transação em dinheiro
export interface CashTransactionInfo {
  amountPaid: number;        // Valor recebido
  changeAmount: number;      // Valor do troco
}

// Dados completos de uma transação de pagamento
export interface PaymentTransaction {
  id: string;                // Identificador único da transação
  type: PaymentMethodType;   // Tipo de pagamento
  status: PaymentStatus;     // Status atual
  amount: number;            // Valor da transação
  currency: string;          // Moeda (geralmente "BRL")
  description?: string;      // Descrição opcional
  reference?: string;        // Referência externa (ex: número do pedido)
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data da última atualização
  completedAt?: Date;        // Data de conclusão (se concluído)
  
  // Dados específicos por tipo de pagamento
  pixInfo?: PixTransactionInfo;
  cardInfo?: CardTransactionInfo;
  cashInfo?: CashTransactionInfo;
  
  // Dados da resposta da processadora
  processorResponse?: {
    code: string;           // Código de retorno
    message: string;        // Mensagem de retorno
    processorName: string;  // Nome da processadora
    raw?: any;              // Dados brutos da resposta (para debug)
  };
  
  // Dados do cliente (opcional)
  customer?: {
    id?: string;            // ID do cliente no sistema
    name?: string;          // Nome do cliente
    email?: string;         // Email para envio de recibo
    document?: string;      // Documento (CPF/CNPJ)
  };

  // Metadados adicionais (flexível)
  metadata?: Record<string, any>;
}

// Configurações para impressora térmica
export interface ThermalPrinterConfig {
  enabled: boolean;          // Impressora habilitada?
  type: 'bluetooth' | 'usb' | 'network' | 'webusb'; // Tipo de conexão
  address?: string;          // Endereço da impressora (IP ou MAC)
  port?: number;             // Porta (para impressoras de rede)
  paperWidth: number;        // Largura do papel em mm (geralmente 58 ou 80)
  characterSet?: string;     // Conjunto de caracteres (ex: "UTF-8", "CP850")
  driver?: string;           // Driver da impressora
}

// Configurações do processador de pagamentos
export interface PaymentProcessorConfig {
  provider: string;          // Nome do provedor (ex: "cielo", "stone", "pagseguro")
  apiKey: string;            // Chave de API
  secretKey: string;         // Chave secreta
  merchantId?: string;       // ID do estabelecimento
  terminalId?: string;       // ID do terminal
  environment: 'production' | 'sandbox'; // Ambiente
  timeout: number;           // Timeout em milissegundos
  
  // Configurações específicas de PIX
  pix?: {
    pixKey: string;          // Chave PIX do recebedor
    pixKeyType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random'; // Tipo de chave
    bankCode?: string;       // Código do banco
    merchantName: string;    // Nome do recebedor
    merchantCity: string;    // Cidade do recebedor
  };
  
  // Configurações de cartão
  card?: {
    acquirer: string;        // Adquirente (ex: "cielo", "rede", "stone")
    autoCapture: boolean;    // Capturar automaticamente?
    installmentsEnabled: boolean; // Habilitar parcelamento?
    maxInstallments: number; // Número máximo de parcelas
    antifraudEnabled: boolean; // Habilitar antifraude?
  };
}

// Dados para pagamento via PIX
export interface PixPaymentInput {
  amount: number;
  description?: string;
  reference?: string;
  expiresIn?: number; // Tempo em segundos até expirar
  customer?: {
    name?: string;
    email?: string;
    document?: string;
  };
  metadata?: Record<string, any>;
}

// Dados para pagamento via cartão
export interface CardPaymentInput {
  amount: number;
  installments: number;
  type: 'credit' | 'debit';
  description?: string;
  reference?: string;
  customer?: {
    name?: string;
    email?: string;
    document?: string;
  };
  metadata?: Record<string, any>;
}

// Dados para pagamento em dinheiro
export interface CashPaymentInput {
  amount: number;
  amountPaid: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

// Resposta genérica de uma operação de pagamento
export interface PaymentResponse {
  success: boolean;
  transaction: PaymentTransaction | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}