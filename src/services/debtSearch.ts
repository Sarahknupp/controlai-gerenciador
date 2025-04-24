import axios from 'axios';
import { cpf as validateCPF, cnpj as validateCNPJ } from 'cpf-cnpj-validator';
import { parseString } from 'xml2js';

// Create browser-compatible promisify wrapper for parseString
const parseXML = (xml: string) => new Promise((resolve, reject) => 
  parseString(xml, (err, result) => {
    if (err) reject(err);
    else resolve(result);
  })
);

export interface DebtRecord {
  id: string;
  creditor: string;
  description: string;
  originalAmount: number;
  currentAmount: number;
  dueDate: Date;
  status: 'regular' | 'late' | 'renegotiated' | 'legal';
  type: 'loan' | 'credit_card' | 'tax' | 'service' | 'other';
  lastUpdate: Date;
  source: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  paymentOptions?: {
    hasDiscount: boolean;
    discountAmount?: number;
    discountDeadline?: Date;
    paymentLink?: string;
  };
}

// Helper function to implement retry logic with exponential backoff
async function retryRequest(requestFn: () => Promise<any>, maxRetries = 2, initialDelay = 1000): Promise<any> {
  let lastError;
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (retries >= maxRetries) break;
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retry attempt ${retries + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  throw lastError;
}

export class DebtSearchService {
  private static readonly SERASA_API = 'https://api.serasa.com.br/v1';
  private static readonly SPC_API = 'https://api.spc.org.br/v1';
  private static readonly RECEITA_API = 'https://api.receita.fazenda.gov.br/v1';
  private static readonly PROTESTO_API = 'https://api.protestos.org.br/v1';
  private static readonly BOLETOS_API = 'https://api.registroboletos.org.br/v1';
  
  private apiKeys: {
    serasa?: string;
    spc?: string;
    receita?: string;
    protesto?: string;
    boletos?: string;
  };

  // Flag to use mock data during development or when APIs are unavailable
  private useMockData: boolean;

  constructor(apiKeys: { 
    serasa?: string; 
    spc?: string; 
    receita?: string; 
    protesto?: string;
    boletos?: string;
  }, useMockData = true) { // Definindo como true por padrão para usar dados mockados
    this.apiKeys = apiKeys;
    this.useMockData = useMockData;
  }

  async searchDebts(identifier: string): Promise<DebtRecord[]> {
    if (!this.isValidIdentifier(identifier)) {
      throw new Error('CPF/CNPJ inválido. Por favor, verifique o número informado.');
    }

    const debts: DebtRecord[] = [];
    const errors: Error[] = [];

    try {
      // Run searches in parallel
      const results = await Promise.allSettled([
        this.searchSerasa(identifier),
        this.searchSPC(identifier),
        this.searchReceitaFederal(identifier),
        this.searchProtestos(identifier),
        this.searchRegistroBoletos(identifier)
      ]);

      // Process results and collect errors
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          debts.push(...result.value);
        } else {
          errors.push(result.reason);
          console.error('Error in debt search:', result.reason);
        }
      });

      // Even if some searches failed, continue with any results we have
      if (debts.length === 0 && errors.length > 0) {
        console.warn('All debt searches failed or returned no results:', errors);
        // Return empty array instead of throwing error to allow UI to handle gracefully
        return [];
      }

      // Sort debts by status and due date
      return this.sortDebts(this.removeDuplicates(debts));
    } catch (error) {
      console.error('Fatal error in debt search:', error);
      // Return empty array instead of throwing to allow UI to handle gracefully
      return [];
    }
  }

  private isValidIdentifier(identifier: string): boolean {
    const cleanIdentifier = identifier.replace(/\D/g, '');
    return validateCPF.isValid(cleanIdentifier) || validateCNPJ.isValid(cleanIdentifier);
  }

  private async searchSerasa(identifier: string): Promise<DebtRecord[]> {
    if (!this.apiKeys.serasa) {
      console.warn('Serasa API key not provided');
      return [];
    }

    if (this.useMockData) {
      return this.getMockSerasaData(identifier);
    }

    try {
      // Simulate an API response delay with mock data in development
      console.log('Simulando consulta Serasa (mockada)...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      return this.getMockSerasaData(identifier);
      
      // Código real que seria usado em produção:
      /*
      // Use retry logic for Serasa API
      const response = await retryRequest(() => 
        axios.get(`${DebtSearchService.SERASA_API}/debts/${identifier}`, {
          headers: { Authorization: `Bearer ${this.apiKeys.serasa}` },
          timeout: 15000, // Increased timeout to 15 seconds
          proxy: false, // Disable proxy to prevent issues
        }),
        2, // Max 2 retries
        1000 // Initial delay of 1 second
      );

      return this.formatSerasaDebts(response.data);
      */
    } catch (error) {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('Consulta Serasa falhou: Timeout - Serviço não respondeu a tempo');
        } else if (error.code === 'ERR_NETWORK') {
          console.error('Consulta Serasa falhou: Problema de rede - Verifique sua conexão');
        } else if (error.response) {
          console.error(`Consulta Serasa falhou: Erro ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.error('Consulta Serasa falhou: Erro de conexão com a API', error.message);
        }
      } else {
        console.error('Consulta Serasa falhou:', error);
      }
      return [];
    }
  }

  private async searchSPC(identifier: string): Promise<DebtRecord[]> {
    if (!this.apiKeys.spc) {
      return [];
    }

    if (this.useMockData) {
      return this.getMockSPCData(identifier);
    }

    try {
      // Simulate an API response delay with mock data in development
      console.log('Simulando consulta SPC (mockada)...');
      await new Promise(resolve => setTimeout(resolve, 800)); // 0.8 second delay
      return this.getMockSPCData(identifier);
      
      // Código real que seria usado em produção:
      /*
      const response = await retryRequest(() => 
        axios.get(`${DebtSearchService.SPC_API}/debts/${identifier}`, {
          headers: { Authorization: `Bearer ${this.apiKeys.spc}` },
          timeout: 15000, // Increased timeout
        }),
        2, // Max 2 retries
        1000 // Initial delay of 1 second
      );

      return this.formatSPCDebts(response.data);
      */
    } catch (error) {
      console.error('Consulta SPC falhou:', error);
      return [];
    }
  }

  private async searchReceitaFederal(identifier: string): Promise<DebtRecord[]> {
    if (!this.apiKeys.receita) {
      return [];
    }

    if (this.useMockData) {
      return this.getMockReceitaData(identifier);
    }

    try {
      // Simulate an API response delay with mock data in development
      console.log('Simulando consulta Receita Federal (mockada)...');
      await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 second delay
      return this.getMockReceitaData(identifier);
      
      // Código real que seria usado em produção:
      /*
      const response = await retryRequest(() => 
        axios.get(`${DebtSearchService.RECEITA_API}/debts/${identifier}`, {
          headers: { Authorization: `Bearer ${this.apiKeys.receita}` },
          timeout: 15000, // Increased timeout
        }),
        2, // Max 2 retries
        1000 // Initial delay of 1 second
      );

      const parsedXML = await parseXML(response.data);
      return this.formatReceitaDebts(parsedXML);
      */
    } catch (error) {
      console.error('Consulta Receita Federal falhou:', error);
      return [];
    }
  }

  private async searchProtestos(identifier: string): Promise<DebtRecord[]> {
    if (!this.apiKeys.protesto) {
      return [];
    }

    if (this.useMockData) {
      return this.getMockProtestoData(identifier);
    }

    try {
      // Simulate an API response delay with mock data in development
      console.log('Simulando consulta Cartórios de Protesto (mockada)...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      return this.getMockProtestoData(identifier);
      
      // Código real que seria usado em produção:
      /*
      const response = await retryRequest(() => 
        axios.get(`${DebtSearchService.PROTESTO_API}/search/${identifier}`, {
          headers: { Authorization: `Bearer ${this.apiKeys.protesto}` },
          timeout: 15000, // Increased timeout
        }),
        2, // Max 2 retries
        1000 // Initial delay of 1 second
      );

      return this.formatProtestoDebts(response.data);
      */
    } catch (error) {
      console.error('Consulta cartório de protestos falhou:', error);
      return [];
    }
  }

  private async searchRegistroBoletos(identifier: string): Promise<DebtRecord[]> {
    if (!this.apiKeys.boletos) {
      console.warn('Registro de Boletos API key not provided');
      return [];
    }

    if (this.useMockData) {
      return this.getMockBoletosData(identifier);
    }

    try {
      // Simulate an API response delay with mock data in development
      console.log('Simulando consulta Registro de Boletos (mockada)...');
      await new Promise(resolve => setTimeout(resolve, 900)); // 0.9 second delay
      return this.getMockBoletosData(identifier);
      
      // Código real que seria usado em produção:
      /*
      // Use retry logic with a more robust error handling approach
      const response = await retryRequest(() => 
        axios.get(`${DebtSearchService.BOLETOS_API}/search/${identifier}`, {
          headers: { Authorization: `Bearer ${this.apiKeys.boletos}` },
          timeout: 15000, // Increased timeout to 15 seconds
          validateStatus: function (status) {
            // Consider any status less than 500 as success to handle 4xx errors gracefully
            return status < 500;
          },
          proxy: false, // Disable proxy to prevent issues
        }),
        2, // Max 2 retries
        1000 // Initial delay of 1 second
      );

      // Check if the response is successful (2xx status)
      if (response.status >= 200 && response.status < 300) {
        return this.formatBoletosDebts(response.data);
      } else {
        console.error(`Consulta registro de boletos retornou status ${response.status}:`, response.data);
        return [];
      }
      */
    } catch (error) {
      // Detailed error logging to help with debugging
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('Consulta registro de boletos falhou: Timeout - Serviço não respondeu a tempo');
        } else if (error.code === 'ERR_NETWORK') {
          console.error('Consulta registro de boletos falhou: Problema de rede - Verifique sua conexão');
        } else if (error.response) {
          console.error('Consulta registro de boletos falhou - Resposta do servidor:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('Consulta registro de boletos falhou - Sem resposta (possível problema CORS)');
          console.error('Detalhes:', error.message);
        } else {
          console.error('Consulta registro de boletos falhou - Erro de configuração:', error.message);
        }
      } else {
        console.error('Consulta registro de boletos falhou - Erro inesperado:', error);
      }
      
      // Always return empty array on error
      return [];
    }
  }

  // Mock data methods for development/testing
  private getMockSerasaData(identifier: string): DebtRecord[] {
    return [{
      id: `serasa-mock-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Banco Mock',
      description: 'Empréstimo pessoal',
      originalAmount: 1500.00,
      currentAmount: 1800.50,
      dueDate: new Date('2025-01-15'),
      status: 'late',
      type: 'loan',
      lastUpdate: new Date(),
      source: 'Serasa (Simulado)',
      contactInfo: {
        phone: '(11) 9999-8888',
        email: 'cobranca@bancomock.com.br'
      },
      paymentOptions: {
        hasDiscount: true,
        discountAmount: 200.00,
        discountDeadline: new Date('2025-02-28'),
        paymentLink: 'https://example.com/payment'
      }
    }];
  }

  private getMockSPCData(identifier: string): DebtRecord[] {
    return [{
      id: `spc-mock-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Loja Mock',
      description: 'Crediário',
      originalAmount: 750.00,
      currentAmount: 900.25,
      dueDate: new Date('2025-03-10'),
      status: 'late',
      type: 'credit_card',
      lastUpdate: new Date(),
      source: 'SPC Brasil (Simulado)',
      contactInfo: {
        phone: '(11) 7777-6666',
        email: 'cobranca@lojamock.com.br'
      }
    }];
  }

  private getMockReceitaData(identifier: string): DebtRecord[] {
    return [{
      id: `receita-mock-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Receita Federal do Brasil',
      description: 'Imposto de Renda Pessoa Física',
      originalAmount: 2500.00,
      currentAmount: 2750.00,
      dueDate: new Date('2025-04-30'),
      status: 'regular',
      type: 'tax',
      lastUpdate: new Date(),
      source: 'Receita Federal (Simulado)'
    }];
  }

  private getMockProtestoData(identifier: string): DebtRecord[] {
    return [{
      id: `protesto-mock-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Distribuidora Mock',
      description: 'Protesto em Cartório - 2º Ofício',
      originalAmount: 1200.00,
      currentAmount: 1450.00,
      dueDate: new Date('2024-12-05'),
      status: 'legal',
      type: 'other',
      lastUpdate: new Date(),
      source: 'Cartório de Protestos (Simulado)',
      paymentOptions: {
        hasDiscount: false,
        paymentLink: 'https://example.com/regularizacao'
      }
    }];
  }

  private getMockBoletosData(identifier: string): DebtRecord[] {
    return [{
      id: `boleto-mock-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Serviços Mock LTDA',
      description: 'Mensalidade de serviço',
      originalAmount: 99.90,
      currentAmount: 105.50,
      dueDate: new Date('2025-01-10'),
      status: 'regular',
      type: 'service',
      lastUpdate: new Date(),
      source: 'Registro de Boletos (Simulado)',
      contactInfo: {
        phone: '(11) 3333-2222',
        email: 'financeiro@servicosmock.com.br'
      },
      paymentOptions: {
        hasDiscount: true,
        discountAmount: 10.00,
        discountDeadline: new Date('2025-01-05'),
        paymentLink: 'https://pagamento.exemplo.com.br/12345'
      }
    }];
  }

  private formatSerasaDebts(data: any): DebtRecord[] {
    return (data?.debts || []).map((debt: any) => ({
      id: debt.id || `serasa-${Math.random().toString(36).substr(2, 9)}`,
      creditor: debt.creditor_name,
      description: debt.description,
      originalAmount: parseFloat(debt.original_amount) || 0,
      currentAmount: parseFloat(debt.current_amount) || 0,
      dueDate: new Date(debt.due_date),
      status: this.normalizeStatus(debt.status),
      type: this.normalizeType(debt.type),
      lastUpdate: new Date(debt.last_update),
      source: 'Serasa',
      contactInfo: debt.contact_info ? {
        phone: debt.contact_info.phone,
        email: debt.contact_info.email
      } : undefined,
      paymentOptions: debt.payment_options ? {
        hasDiscount: !!debt.payment_options.discount_amount,
        discountAmount: parseFloat(debt.payment_options.discount_amount) || undefined,
        discountDeadline: debt.payment_options.discount_deadline ? new Date(debt.payment_options.discount_deadline) : undefined,
        paymentLink: debt.payment_options.payment_url || undefined
      } : undefined
    }));
  }

  private formatSPCDebts(data: any): DebtRecord[] {
    return (data?.debts || []).map((debt: any) => ({
      id: debt.debt_id || `spc-${Math.random().toString(36).substr(2, 9)}`,
      creditor: debt.creditor,
      description: debt.debt_description,
      originalAmount: parseFloat(debt.original_value) || 0,
      currentAmount: parseFloat(debt.current_value) || 0,
      dueDate: new Date(debt.due_date),
      status: this.normalizeStatus(debt.debt_status),
      type: this.normalizeType(debt.debt_type),
      lastUpdate: new Date(debt.updated_at),
      source: 'SPC Brasil',
      contactInfo: debt.contact ? {
        phone: debt.contact.phone,
        email: debt.contact.email
      } : undefined,
      paymentOptions: debt.payment ? {
        hasDiscount: !!debt.payment.discount,
        discountAmount: parseFloat(debt.payment.discount) || undefined,
        discountDeadline: debt.payment.discount_deadline ? new Date(debt.payment.discount_deadline) : undefined,
        paymentLink: debt.payment.url || undefined
      } : undefined
    }));
  }

  private formatReceitaDebts(data: any): DebtRecord[] {
    const debts = data?.debitos?.divida || [];
    return Array.isArray(debts) ? debts.map((debt: any) => ({
      id: debt.numero?.[0] || `receita-${Math.random().toString(36).substr(2, 9)}`,
      creditor: 'Receita Federal do Brasil',
      description: debt.descricao?.[0] || 'Débito com a Receita Federal',
      originalAmount: parseFloat(debt.valor_original?.[0]) || 0,
      currentAmount: parseFloat(debt.valor_atualizado?.[0]) || 0,
      dueDate: new Date(debt.data_vencimento?.[0]),
      status: this.normalizeStatus(debt.situacao?.[0]),
      type: 'tax',
      lastUpdate: new Date(debt.data_atualizacao?.[0]),
      source: 'Receita Federal',
      paymentOptions: debt.pagamento?.[0] ? {
        hasDiscount: debt.pagamento?.[0]?.desconto?.[0] === 'sim',
        discountAmount: parseFloat(debt.pagamento?.[0]?.valor_desconto?.[0]) || undefined,
        discountDeadline: debt.pagamento?.[0]?.data_limite?.[0] ? new Date(debt.pagamento?.[0]?.data_limite?.[0]) : undefined,
        paymentLink: debt.pagamento?.[0]?.link_pagamento?.[0] || undefined
      } : undefined
    })) : [];
  }

  private formatProtestoDebts(data: any): DebtRecord[] {
    return (data?.protestos || []).map((protesto: any) => ({
      id: protesto.id || `protesto-${Math.random().toString(36).substr(2, 9)}`,
      creditor: protesto.credor_nome || 'Cartório de Protestos',
      description: `Protesto em Cartório - ${protesto.cartorio || 'Não especificado'}`,
      originalAmount: parseFloat(protesto.valor_original) || 0,
      currentAmount: parseFloat(protesto.valor_atualizado) || 0,
      dueDate: new Date(protesto.data_vencimento),
      status: 'legal',
      type: protesto.tipo_divida ? this.normalizeType(protesto.tipo_divida) : 'other',
      lastUpdate: new Date(protesto.data_protesto),
      source: 'Cartório de Protestos',
      contactInfo: protesto.contato ? {
        phone: protesto.contato.telefone,
        email: protesto.contato.email
      } : undefined,
      paymentOptions: {
        hasDiscount: false,
        paymentLink: protesto.link_regularizacao || undefined
      }
    }));
  }

  private formatBoletosDebts(data: any): DebtRecord[] {
    return (data?.boletos || []).map((boleto: any) => ({
      id: boleto.id || `boleto-${Math.random().toString(36).substr(2, 9)}`,
      creditor: boleto.beneficiario || 'Emissor não identificado',
      description: boleto.descricao || 'Boleto Bancário',
      originalAmount: parseFloat(boleto.valor_original) || 0,
      currentAmount: parseFloat(boleto.valor_atualizado) || 0,
      dueDate: new Date(boleto.data_vencimento),
      status: new Date(boleto.data_vencimento) > new Date() ? 'regular' : 'late',
      type: this.determineBoletType(boleto.descricao),
      lastUpdate: new Date(boleto.data_registro),
      source: 'Registro de Boletos',
      contactInfo: boleto.contato ? {
        phone: boleto.contato.telefone,
        email: boleto.contato.email
      } : undefined,
      paymentOptions: {
        hasDiscount: !!boleto.desconto,
        discountAmount: parseFloat(boleto.desconto) || undefined,
        discountDeadline: boleto.data_limite_desconto ? new Date(boleto.data_limite_desconto) : undefined,
        paymentLink: boleto.linha_digitavel ? `https://pagamento.exemplo.com.br/${boleto.linha_digitavel}` : undefined
      }
    }));
  }

  private determineBoletType(description?: string): DebtRecord['type'] {
    if (!description) return 'other';
    
    const desc = description.toLowerCase();
    if (desc.includes('empréstimo') || desc.includes('financiamento')) {
      return 'loan';
    }
    if (desc.includes('cartão') || desc.includes('crédito')) {
      return 'credit_card';
    }
    if (desc.includes('imposto') || desc.includes('taxa') || desc.includes('tributo')) {
      return 'tax';
    }
    if (desc.includes('serviço') || desc.includes('mensalidade')) {
      return 'service';
    }
    return 'other';
  }

  private normalizeStatus(status?: string): DebtRecord['status'] {
    if (!status) return 'regular';
    
    const statusMap: Record<string, DebtRecord['status']> = {
      'REGULAR': 'regular',
      'EM_DIA': 'regular',
      'NORMAL': 'regular',
      'ATRASADO': 'late',
      'VENCIDO': 'late',
      'INADIMPLENTE': 'late',
      'RENEGOCIADO': 'renegotiated',
      'JUDICIAL': 'legal',
      'EM_PROCESSO': 'legal',
      'PROTESTADO': 'legal'
    };

    return statusMap[status.toUpperCase()] || 'regular';
  }

  private normalizeType(type?: string): DebtRecord['type'] {
    if (!type) return 'other';
    
    const typeMap: Record<string, DebtRecord['type']> = {
      'EMPRESTIMO': 'loan',
      'LOAN': 'loan',
      'CARTAO': 'credit_card',
      'CREDIT_CARD': 'credit_card',
      'IMPOSTO': 'tax',
      'TAX': 'tax',
      'SERVICO': 'service',
      'SERVICE': 'service'
    };

    return typeMap[type.toUpperCase()] || 'other';
  }

  private removeDuplicates(debts: DebtRecord[]): DebtRecord[] {
    const seen = new Set<string>();
    return debts.filter(debt => {
      const key = `${debt.creditor}-${debt.originalAmount}-${debt.dueDate.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortDebts(debts: DebtRecord[]): DebtRecord[] {
    return debts.sort((a, b) => {
      // Sort by status priority (late > legal > renegotiated > regular)
      const statusPriority: Record<DebtRecord['status'], number> = {
        'late': 4,
        'legal': 3,
        'renegotiated': 2,
        'regular': 1
      };

      const statusDiff = statusPriority[b.status] - statusPriority[a.status];
      if (statusDiff !== 0) return statusDiff;

      // Then sort by due date (earliest first)
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }
}