import { 
  PaymentMethodType, 
  PaymentStatus,
  PaymentTransaction,
  PixTransactionInfo,
  CardTransactionInfo,
  CashTransactionInfo,
  PaymentResponse,
  PixPaymentInput,
  CardPaymentInput,
  CashPaymentInput
} from '../types/payment';

/**
 * Serviço para processamento de pagamentos
 */
export class PaymentService {
  private apiUrl: string;
  private apiKey: string;
  private secretKey: string;
  private merchantId: string;
  private environment: 'production' | 'sandbox';
  private pixEnabled: boolean = true;
  private cardEnabled: boolean = true;

  constructor() {
    // Em um ambiente real, estas configurações viriam de variáveis de ambiente
    this.apiUrl = import.meta.env.VITE_PAYMENT_API_URL || 'https://api.example.com/v1';
    this.apiKey = import.meta.env.VITE_PAYMENT_API_KEY || 'demo-key';
    this.secretKey = import.meta.env.VITE_PAYMENT_SECRET_KEY || 'demo-secret';
    this.merchantId = import.meta.env.VITE_PAYMENT_MERCHANT_ID || 'merchant-1';
    this.environment = (import.meta.env.VITE_PAYMENT_ENVIRONMENT === 'production') 
      ? 'production' 
      : 'sandbox';
  }

  /**
   * Processa um pagamento via PIX
   */
  async processPixPayment(input: PixPaymentInput): Promise<PaymentResponse> {
    try {
      if (!this.pixEnabled) {
        return {
          success: false,
          transaction: null,
          error: {
            code: 'PIX_DISABLED',
            message: 'Pagamento via PIX não está habilitado',
            details: null
          }
        };
      }

      console.log(`[PaymentService] Processando pagamento PIX: R$ ${input.amount.toFixed(2)}`);

      // Simula uma chamada à API de pagamentos
      // Em um ambiente real, aqui teríamos uma chamada HTTP para a API da processadora
      try {
        await this.simulateApiCall();
      } catch (apiError) {
        // Em vez de deixar o erro propagar, capturamos e retornamos uma resposta de erro estruturada
        return {
          success: false,
          transaction: null,
          error: {
            code: 'API_COMMUNICATION_ERROR',
            message: apiError instanceof Error ? apiError.message : 'Erro de comunicação com a API de pagamentos',
            details: apiError
          }
        };
      }

      // Gera um QR Code fictício para demonstração
      const qrCodeData = this.generateSampleQrCode(input.amount);
      const transactionId = `PIX${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expira em 30 minutos

      // Cria o objeto de transação
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: 'pix',
        status: 'pending',
        amount: input.amount,
        currency: 'BRL',
        description: input.description || 'Pagamento via PIX',
        reference: input.reference,
        createdAt: new Date(),
        updatedAt: new Date(),
        pixInfo: {
          qrCodeData,
          qrCodeImage: this.generateSampleQrCodeImage(),
          expiresAt,
          key: this.generateRandomPixKey(),
          transactionId
        },
        customer: input.customer,
        metadata: input.metadata,
        processorResponse: {
          code: '00',
          message: 'Sucesso',
          processorName: 'PIX Demo'
        }
      };

      // Em um cenário real, salvaria a transação no banco de dados
      this.saveTransaction(transaction);

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      
      return {
        success: false,
        transaction: null,
        error: {
          code: 'PIX_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao processar pagamento PIX',
          details: error
        }
      };
    }
  }

  /**
   * Processa um pagamento via cartão (TEF)
   */
  async processCardPayment(input: CardPaymentInput): Promise<PaymentResponse> {
    try {
      if (!this.cardEnabled) {
        return {
          success: false,
          transaction: null,
          error: {
            code: 'CARD_DISABLED',
            message: 'Pagamento via cartão não está habilitado',
            details: null
          }
        };
      }

      console.log(`[PaymentService] Processando pagamento com cartão ${input.type}: R$ ${input.amount.toFixed(2)}`);

      // Simula uma chamada à API de pagamentos
      try {
        await this.simulateApiCall(true); // true para simular processamento mais longo
      } catch (apiError) {
        // Em vez de deixar o erro propagar, capturamos e retornamos uma resposta de erro estruturada
        return {
          success: false,
          transaction: null,
          error: {
            code: 'API_COMMUNICATION_ERROR',
            message: apiError instanceof Error ? apiError.message : 'Erro de comunicação com a API de pagamentos',
            details: apiError
          }
        };
      }

      // Gera informações fictícias da transação de cartão
      const cardInfo: CardTransactionInfo = {
        brand: this.getRandomCardBrand(),
        lastDigits: this.generateRandomDigits(4),
        authorizationCode: this.generateAuthorizationCode(),
        nsuHost: this.generateRandomDigits(12),
        nsuLocal: this.generateRandomDigits(10),
        installments: input.installments,
        cardholderName: input.customer?.name || 'CLIENTE',
        receiptData: 'SIMULAÇÃO DE COMPROVANTE TEF'
      };

      const transactionId = `CARD${Date.now()}`;

      // Cria o objeto de transação
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: input.type === 'credit' ? 'credit' : 'debit',
        status: 'approved',
        amount: input.amount,
        currency: 'BRL',
        description: input.description || `Pagamento com cartão ${input.type}`,
        reference: input.reference,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        cardInfo,
        customer: input.customer,
        metadata: input.metadata,
        processorResponse: {
          code: '00',
          message: 'Transação autorizada',
          processorName: 'TEF Demo'
        }
      };

      // Em um cenário real, salvaria a transação no banco de dados
      this.saveTransaction(transaction);

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      
      return {
        success: false,
        transaction: null,
        error: {
          code: 'CARD_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao processar pagamento com cartão',
          details: error
        }
      };
    }
  }

  /**
   * Processa um pagamento em dinheiro
   */
  async processCashPayment(input: CashPaymentInput): Promise<PaymentResponse> {
    try {
      console.log(`[PaymentService] Processando pagamento em dinheiro: R$ ${input.amount.toFixed(2)}`);

      // Para pagamento em dinheiro, calcular o troco
      const changeAmount = Math.max(0, input.amountPaid - input.amount);

      const transactionId = `CASH${Date.now()}`;

      // Cria o objeto de transação
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: 'cash',
        status: 'approved',
        amount: input.amount,
        currency: 'BRL',
        description: input.description || 'Pagamento em dinheiro',
        reference: input.reference,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        cashInfo: {
          amountPaid: input.amountPaid,
          changeAmount
        },
        customer: undefined,
        metadata: input.metadata,
        processorResponse: {
          code: '00',
          message: 'Processado localmente',
          processorName: 'Local'
        }
      };

      // Em um cenário real, salvaria a transação no banco de dados
      this.saveTransaction(transaction);

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Erro ao processar pagamento em dinheiro:', error);
      
      return {
        success: false,
        transaction: null,
        error: {
          code: 'CASH_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao processar pagamento em dinheiro',
          details: error
        }
      };
    }
  }

  /**
   * Consulta o status de uma transação de pagamento
   */
  async checkTransactionStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      console.log(`[PaymentService] Consultando status da transação: ${transactionId}`);

      // Em um cenário real, buscaria a transação do banco de dados
      const transaction = this.getTransactionById(transactionId);

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Para transações PIX pendentes, simulamos um status aleatório
      if (transaction.type === 'pix' && transaction.status === 'pending') {
        // 30% de chance de aprovar a transação em cada consulta
        if (Math.random() < 0.3) {
          transaction.status = 'approved';
          transaction.completedAt = new Date();
          transaction.updatedAt = new Date();
          this.saveTransaction(transaction); // Atualizar no banco fictício
        }
      }

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Erro ao consultar status da transação:', error);
      
      return {
        success: false,
        transaction: null,
        error: {
          code: 'STATUS_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao consultar status da transação',
          details: error
        }
      };
    }
  }

  /**
   * Cancela uma transação de pagamento
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<PaymentResponse> {
    try {
      console.log(`[PaymentService] Cancelando transação: ${transactionId}`);

      // Em um cenário real, buscaria a transação do banco de dados
      const transaction = this.getTransactionById(transactionId);

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Verifica se a transação pode ser cancelada
      if (transaction.status !== 'approved' && transaction.status !== 'pending') {
        throw new Error(`Transação no status ${transaction.status} não pode ser cancelada`);
      }

      // Simula chamada à API para cancelamento
      try {
        await this.simulateApiCall();
      } catch (apiError) {
        return {
          success: false,
          transaction,
          error: {
            code: 'API_COMMUNICATION_ERROR',
            message: apiError instanceof Error ? apiError.message : 'Erro de comunicação com a API de pagamentos',
            details: apiError
          }
        };
      }

      // Atualiza o status da transação
      transaction.status = 'cancelled';
      transaction.updatedAt = new Date();
      transaction.metadata = {
        ...(transaction.metadata || {}),
        cancellation_reason: reason || 'Solicitação do usuário',
        cancelled_at: new Date().toISOString()
      };

      // Em um cenário real, atualizaria a transação no banco de dados
      this.saveTransaction(transaction);

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
      
      return {
        success: false,
        transaction: null,
        error: {
          code: 'CANCELLATION_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao cancelar transação',
          details: error
        }
      };
    }
  }

  /**
   * Gera um recibo em PDF para uma transação
   */
  async generateReceipt(transactionId: string): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
      console.log(`[PaymentService] Gerando recibo para transação: ${transactionId}`);

      // Em um cenário real, buscaria a transação do banco de dados
      const transaction = this.getTransactionById(transactionId);

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Simula a geração de um recibo
      try {
        await this.simulateApiCall();
      } catch (apiError) {
        return {
          success: false,
          error: apiError instanceof Error ? apiError.message : 'Erro de comunicação na geração do recibo'
        };
      }

      // Em um ambiente real, geraria um PDF e retornaria a URL
      const receiptUrl = `https://example.com/receipts/${transactionId}.pdf`;

      return {
        success: true,
        url: receiptUrl
      };
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar recibo'
      };
    }
  }

  /**
   * Envia um recibo por e-mail
   */
  async sendReceiptByEmail(transactionId: string, email: string): Promise<{ success: boolean, error?: string }> {
    try {
      console.log(`[PaymentService] Enviando recibo para ${email}, transação: ${transactionId}`);

      // Em um cenário real, buscaria a transação do banco de dados e enviaria o e-mail
      const transaction = this.getTransactionById(transactionId);

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Simula o envio de e-mail
      try {
        await this.simulateApiCall();
      } catch (apiError) {
        return {
          success: false,
          error: apiError instanceof Error ? apiError.message : 'Erro de comunicação no envio do recibo'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao enviar recibo por e-mail:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar recibo por e-mail'
      };
    }
  }

  /**
   * Verifica se a configuração de pagamento está válida
   */
  async checkConfiguration(): Promise<{ valid: boolean, issues: string[] }> {
    try {
      console.log('[PaymentService] Verificando configuração de pagamento');

      // Simula verificação de configuração
      try {
        await this.simulateApiCall();
      } catch (apiError) {
        return {
          valid: false,
          issues: [apiError instanceof Error ? apiError.message : 'Erro de comunicação com a API de pagamentos']
        };
      }

      // No ambiente real, verificaria se as credenciais estão corretas,
      // se os serviços estão disponíveis, etc.

      return {
        valid: true,
        issues: []
      };
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      
      return {
        valid: false,
        issues: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  // ==========================================
  // Métodos auxiliares para simulação
  // ==========================================

  /**
   * Simula uma chamada à API com delay
   */
  private async simulateApiCall(longer = false): Promise<void> {
    const delay = longer ? 2000 + Math.random() * 2000 : 500 + Math.random() * 1000;
    
    // Simulando um tempo de resposta variável para ser mais realista
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulando um erro ocasional (10% de chance)
    if (Math.random() < 0.1 && this.environment === 'sandbox') {
      throw new Error('Falha simulada na comunicação com a API de pagamentos');
    }
  }

  /**
   * Gera um QR Code de exemplo para PIX
   */
  private generateSampleQrCode(amount: number): string {
    // Formato do Payload PIX (simplificado)
    return `00020126580014br.gov.bcb.pix0136${this.generateRandomPixKey()}5204000053039865802BR5913EMPRESA DEMO6009SAO PAULO62070503***630496C4`;
  }

  /**
   * Gera uma imagem de QR Code (base64)
   */
  private generateSampleQrCodeImage(): string {
    // Normalmente isso seria gerado por uma biblioteca real
    // Para este exemplo, retornamos uma string base64 vazia
    return '';
  }

  /**
   * Gera uma chave PIX aleatória
   */
  private generateRandomPixKey(): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  }

  /**
   * Gera dígitos aleatórios
   */
  private generateRandomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * Gera um código de autorização aleatório
   */
  private generateAuthorizationCode(): string {
    return this.generateRandomDigits(6);
  }

  /**
   * Retorna uma bandeira de cartão aleatória
   */
  private getRandomCardBrand(): string {
    const brands = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];
    return brands[Math.floor(Math.random() * brands.length)];
  }

  /**
   * Simula o armazenamento da transação
   */
  private saveTransaction(transaction: PaymentTransaction): void {
    // Em um ambiente real, salvaria no banco de dados
    // Para esta simulação, salvamos em localStorage para persistir entre recarregamentos da página
    
    try {
      let transactions = localStorage.getItem('payment_transactions');
      let transactionList: PaymentTransaction[] = [];
      
      if (transactions) {
        transactionList = JSON.parse(transactions);
      }
      
      const existingIndex = transactionList.findIndex(t => t.id === transaction.id);
      
      if (existingIndex >= 0) {
        // Atualizar transação existente
        transactionList[existingIndex] = transaction;
      } else {
        // Adicionar nova transação
        transactionList.push(transaction);
      }
      
      localStorage.setItem('payment_transactions', JSON.stringify(transactionList));
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  }

  /**
   * Busca uma transação pelo ID
   */
  private getTransactionById(transactionId: string): PaymentTransaction | null {
    try {
      const transactions = localStorage.getItem('payment_transactions');
      
      if (!transactions) {
        return null;
      }
      
      const transactionList: PaymentTransaction[] = JSON.parse(transactions);
      return transactionList.find(t => t.id === transactionId) || null;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return null;
    }
  }

  /**
   * Calcula frete baseado no CEP
   */
  async calculateShippingFee(zipCode: string): Promise<number> {
    // Em um cenário real, faria uma consulta a uma API de frete
    await this.simulateApiCall();
    
    // Retornar um valor fictício baseado no CEP
    const numericZip = parseInt(zipCode.replace(/\D/g, ''), 10) || 0;
    const baseShipping = 15.0;
    
    // Variação aleatória de -3 a +5 reais
    const variation = (Math.random() * 8) - 3; 
    
    return parseFloat((baseShipping + variation).toFixed(2));
  }
}

// Exporta uma instância única do serviço
export const paymentService = new PaymentService();
export default paymentService;