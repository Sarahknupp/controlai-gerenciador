import axios from 'axios';
import { Base64 } from 'js-base64';
import { FiscalDocument, FiscalDocumentType, FiscalDocumentStatus, Sale, SaleItem } from '../types/pos';

/**
 * Service for handling fiscal document operations (NFCe/NFe)
 */
export class FiscalService {
  private apiUrl: string;
  private apiKey: string;
  private companyId: string;
  private isTest: boolean;
  private fallbackMode: boolean = false;
  private lastServiceCheck: number = 0;
  private serviceAvailabilityCache: boolean | null = null;

  constructor(apiUrl: string, apiKey: string, companyId: string, isTest: boolean = false) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.companyId = companyId;
    this.isTest = isTest;
  }

  /**
   * Issue a new fiscal document for a sale
   */
  async issueFiscalDocument(
    sale: Sale,
    items: SaleItem[],
    documentType: FiscalDocumentType = 'nfce',
    contingencyMode: boolean = false
  ): Promise<FiscalDocument> {
    try {
      // If in fallback mode, issue in contingency mode
      const useContingency = this.fallbackMode || contingencyMode;
      
      // Prepare document data according to the fiscal requirements
      const documentData = this.prepareFiscalData(sale, items, documentType, useContingency);
      
      // Call fiscal service API
      const response = await axios.post(
        `${this.apiUrl}/documents`,
        documentData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Error issuing fiscal document: ${response.statusText}`);
      }
      
      const result = response.data;
      
      // Map API response to our FiscalDocument type
      const fiscalDocument: FiscalDocument = {
        id: result.id,
        sale_id: sale.id,
        document_type: documentType,
        document_number: result.document_number || '',
        access_key: result.access_key,
        series: result.series,
        issue_date: result.issue_date || new Date().toISOString(),
        status: this.mapStatusFromApi(result.status),
        status_message: result.status_message,
        xml: result.xml ? Base64.encode(result.xml) : undefined,
        pdf_url: result.pdf_url,
        contingency_mode: useContingency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        external_id: result.id
      };
      
      // Reset fallback mode if successful
      if (this.fallbackMode) {
        this.fallbackMode = false;
      }
      
      return fiscalDocument;
    } catch (error) {
      console.error("Error issuing fiscal document:", error);
      
      // Set fallback mode if API is unreachable
      if (axios.isAxiosError(error) && !error.response) {
        this.fallbackMode = true;
      }
      
      // If fallback mode is needed and not already in contingency, retry in contingency mode
      if (this.fallbackMode && !contingencyMode) {
        console.log("Retrying in contingency mode...");
        return this.issueFiscalDocument(sale, items, documentType, true);
      }
      
      // Create a rejected document for offline storage
      const offlineDocument: FiscalDocument = {
        id: `offline-${Date.now()}`,
        sale_id: sale.id,
        document_type: documentType,
        document_number: `${Date.now()}`,
        issue_date: new Date().toISOString(),
        status: 'pending',
        status_message: 'Emissão offline pendente',
        contingency_mode: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Store offline document for later processing
      this.storeOfflineDocument(offlineDocument, sale, items);
      
      return offlineDocument;
    }
  }
  
  /**
   * Fetch a fiscal document by ID
   */
  async getDocument(documentId: string): Promise<{
    data: FiscalDocument | null;
    error: { code: string; message: string } | null;
  }> {
    try {
      // Check if it's an offline document
      const offlineDocuments = this.getOfflineDocuments();
      const offlineDoc = offlineDocuments.find(doc => doc.document.id === documentId);
      
      if (offlineDoc) {
        return { 
          data: offlineDoc.document,
          error: null
        };
      }
      
      // Otherwise fetch from API
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`Error fetching document: ${response.statusText}`);
      }
      
      const result = response.data;
      
      // Map API response to our FiscalDocument type
      const fiscalDocument: FiscalDocument = {
        id: result.id,
        sale_id: result.sale_id,
        document_type: result.document_type,
        document_number: result.document_number,
        access_key: result.access_key,
        series: result.series,
        issue_date: result.issue_date,
        status: this.mapStatusFromApi(result.status),
        status_message: result.status_message,
        xml: result.xml ? Base64.encode(result.xml) : undefined,
        pdf_url: result.pdf_url,
        cancellation_date: result.cancellation_date,
        cancellation_reason: result.cancellation_reason,
        contingency_mode: result.contingency_mode,
        created_at: result.created_at,
        updated_at: result.updated_at,
        external_id: result.external_id
      };
      
      return { 
        data: fiscalDocument,
        error: null
      };
    } catch (error) {
      console.error("Error getting document:", error);
      
      return {
        data: null,
        error: { 
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao buscar documento'
        }
      };
    }
  }
  
  /**
   * Check the status of a fiscal document
   */
  async checkDocumentStatus(documentId: string): Promise<FiscalDocumentStatus> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return this.mapStatusFromApi(response.data.status);
    } catch (error) {
      console.error("Error checking document status:", error);
      return 'rejected';
    }
  }
  
  /**
   * Cancel a fiscal document
   */
  async cancelDocument(
    documentId: string, 
    reason: string
  ): Promise<{ success: boolean; message: string; }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/cancel`,
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        message: response.data.message || 'Documento cancelado com sucesso'
      };
    } catch (error) {
      console.error("Error cancelling document:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Erro ao cancelar documento'
        };
      }
      
      return {
        success: false,
        message: 'Erro ao comunicar com servidor fiscal'
      };
    }
  }
  
  /**
   * Print a fiscal document
   */
  async printDocument(
    documentId: string, 
    printerId?: string
  ): Promise<{ success: boolean; message: string; }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/print`,
        { printer_id: printerId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        message: response.data.message || 'Documento enviado para impressão'
      };
    } catch (error) {
      console.error("Error printing document:", error);
      return {
        success: false,
        message: 'Erro ao imprimir documento'
      };
    }
  }
  
  /**
   * Send fiscal document by email
   */
  async sendDocumentByEmail(
    documentId: string, 
    email: string
  ): Promise<{ success: boolean; message: string; }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/email`,
        { email },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        message: response.data.message || 'Documento enviado por email'
      };
    } catch (error) {
      console.error("Error sending document by email:", error);
      return {
        success: false,
        message: 'Erro ao enviar documento por email'
      };
    }
  }
  
  /**
   * Get document PDF (base64 encoded)
   */
  async getDocumentPdf(documentId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'text'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error getting document PDF:", error);
      return null;
    }
  }
  
  /**
   * Synchronize offline documents
   */
  async syncOfflineDocuments(): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    message: string;
  }> {
    try {
      // Get stored offline documents
      const offlineDocuments = this.getOfflineDocuments();
      
      if (offlineDocuments.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          message: 'No offline documents to sync'
        };
      }
      
      let synced = 0;
      let failed = 0;
      
      // Process each document
      for (const doc of offlineDocuments) {
        try {
          if (!doc.sale || !doc.items) {
            failed++;
            continue;
          }
          
          // Try to issue the document online
          await this.issueFiscalDocument(
            doc.sale, 
            doc.items, 
            doc.document.document_type,
            false
          );
          
          // Remove from offline storage on success
          await this.removeOfflineDocument(doc.document.id);
          synced++;
        } catch (error) {
          console.error(`Error syncing document ${doc.document.id}:`, error);
          failed++;
        }
      }
      
      return {
        success: true,
        synced,
        failed,
        message: `Sincronizados ${synced} documentos, ${failed} falhas`
      };
    } catch (error) {
      console.error("Error syncing offline documents:", error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: 'Erro ao sincronizar documentos offline'
      };
    }
  }
  
  /**
   * Prepare fiscal data from sale and items
   */
  private prepareFiscalData(
    sale: Sale, 
    items: SaleItem[], 
    documentType: FiscalDocumentType, 
    contingencyMode: boolean
  ): any {
    // Prepare the customer data
    const customer = sale.customer ? {
      name: sale.customer.name,
      document: sale.customer.document || undefined,
      // Other customer fields would be here
    } : undefined;
    
    // Prepare the items data
    const fiscalItems = items.map(item => {
      // Ideally, the product's fiscal data should be available in the item or related product
      // This is a simplified version
      return {
        code: item.product_sku,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        // Other fiscal information would be included here (NCM, CFOP, etc.)
      };
    });
    
    // Prepare the payment data
    const payments = sale.payment_details.map(payment => {
      return {
        method: payment.method,
        amount: payment.amount,
        // Other payment details would be included here
      };
    });
    
    // Build the complete document data
    return {
      company_id: this.companyId,
      document_type: documentType,
      is_test: this.isTest,
      contingency_mode: contingencyMode,
      customer,
      items: fiscalItems,
      payments,
      total: sale.total,
      discount_amount: sale.discount_amount,
      tax_amount: sale.tax_amount,
      // Additional fiscal fields would be included here
      additional_info: sale.notes,
    };
  }
  
  /**
   * Map API status to internal status
   */
  private mapStatusFromApi(apiStatus: string): FiscalDocumentStatus {
    const statusMap: Record<string, FiscalDocumentStatus> = {
      'pending': 'pending',
      'processing': 'processing',
      'issued': 'issued',
      'approved': 'issued',
      'rejected': 'rejected',
      'error': 'rejected',
      'cancelled': 'cancelled',
    };
    
    return statusMap[apiStatus.toLowerCase()] || 'pending';
  }
  
  /**
   * Store an offline document for later processing
   */
  private async storeOfflineDocument(
    document: FiscalDocument, 
    sale: Sale, 
    items: SaleItem[]
  ): Promise<void> {
    try {
      // Use localStorage or IndexedDB for client-side storage
      // Here we'll use localStorage for simplicity
      const offlineDocuments = this.getOfflineDocuments();
      
      offlineDocuments.push({ document, sale, items });
      
      localStorage.setItem(
        'offline_fiscal_documents', 
        JSON.stringify(offlineDocuments)
      );
    } catch (error) {
      console.error("Error storing offline document:", error);
    }
  }
  
  /**
   * Get all stored offline documents
   */
  private getOfflineDocuments(): Array<{
    document: FiscalDocument;
    sale: Sale;
    items: SaleItem[];
  }> {
    try {
      const stored = localStorage.getItem('offline_fiscal_documents');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error getting offline documents:", error);
      return [];
    }
  }
  
  /**
   * Remove an offline document from storage
   */
  private async removeOfflineDocument(documentId: string): Promise<void> {
    try {
      const offlineDocuments = this.getOfflineDocuments();
      const updatedDocuments = offlineDocuments.filter(
        doc => doc.document.id !== documentId
      );
      
      localStorage.setItem(
        'offline_fiscal_documents', 
        JSON.stringify(updatedDocuments)
      );
    } catch (error) {
      console.error("Error removing offline document:", error);
    }
  }
  
  /**
   * Check if the service is available
   * Enhanced with caching, better error handling, and mock response for development
   */
  async checkServiceAvailability(): Promise<boolean> {
    // Check cache if it's been less than 30 seconds since last check
    const now = Date.now();
    if (this.serviceAvailabilityCache !== null && now - this.lastServiceCheck < 30000) {
      return this.serviceAvailabilityCache;
    }
    
    try {
      // In development mode with no API URL, return a mock response
      if (this.apiUrl === 'https://api.fiscal.example.com/v1' || !this.apiUrl) {
        console.log('Using mock fiscal service response for development');
        this.serviceAvailabilityCache = true;
        this.lastServiceCheck = now;
        return true;
      }
      
      const response = await axios.get(
        `${this.apiUrl}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 5000
        }
      );
      
      const isAvailable = response.status === 200;
      this.serviceAvailabilityCache = isAvailable;
      this.lastServiceCheck = now;
      return isAvailable;
    } catch (error) {
      console.warn("Error checking fiscal service availability:", error);
      
      // If we're in development mode with demo keys, don't log the full error
      if (this.apiKey === 'demo-key') {
        console.log('Development mode: Simulating fiscal service availability');
        this.serviceAvailabilityCache = true;
        this.lastServiceCheck = now;
        return true;
      }
      
      // For network errors, cache the negative result to avoid excessive retries
      this.serviceAvailabilityCache = false;
      this.lastServiceCheck = now;
      return false;
    }
  }
}

// Export a singleton instance for use throughout the application
export const fiscalService = new FiscalService(
  import.meta.env.VITE_FISCAL_API_URL || 'https://api.fiscal.example.com/v1',
  import.meta.env.VITE_FISCAL_API_KEY || 'demo-key',
  import.meta.env.VITE_FISCAL_COMPANY_ID || 'demo-company',
  import.meta.env.VITE_FISCAL_TEST_MODE === 'true'
);

export default fiscalService;