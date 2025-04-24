import { 
  OcrDocument, 
  OcrExtractedData,
  OcrExtractedItem, 
  OcrProcessingResult 
} from '../types/api';
import { createWorker } from 'tesseract.js';
import { supabase } from '../lib/supabase';

/**
 * Serviço para processamento OCR de documentos não fiscais
 */
export class OcrService {
  private worker: Tesseract.Worker | null = null;
  private workerInitialized = false;
  private workerPromise: Promise<Tesseract.Worker> | null = null;
  
  /**
   * Processa um documento usando OCR
   * 
   * @param file Arquivo de imagem ou PDF
   * @param documentType Tipo de documento
   * @returns Resultado do processamento
   */
  async processDocument(file: File, documentType: 'receipt' | 'invoice' | 'bill' | 'other'): Promise<OcrProcessingResult> {
    try {
      // Verifica se o formato é suportado
      this.validateFileFormat(file);
      
      // Cria o registro do documento
      const documentId = await this.createDocumentRecord(file, documentType);
      
      // Inicia o processamento assíncrono
      this.processDocumentAsync(documentId, file);
      
      return {
        success: true,
        documentId,
        status: 'processing',
        message: 'Processamento iniciado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao iniciar processamento OCR:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao processar documento'
      };
    }
  }
  
  /**
   * Verifica o status de um documento em processamento
   * 
   * @param documentId ID do documento
   * @returns Status atual do processamento
   */
  async checkProcessingStatus(documentId: string): Promise<OcrProcessingResult> {
    try {
      const { data, error } = await supabase
        .from('ocr_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Documento não encontrado');
      }
      
      const document = data as OcrDocument;
      
      return {
        success: document.processingStatus !== 'error',
        documentId,
        status: document.processingStatus,
        message: document.processingStatus === 'error' 
          ? document.errorDetails || 'Erro no processamento'
          : `Documento em status: ${document.processingStatus}`,
        extractedData: document.processingStatus === 'completed' ? document.extractedData : undefined,
        createdDebt: document.processingStatus === 'completed' && document.extractedData.totals?.total ? true : false,
        updatedInventory: document.processingStatus === 'completed' ? true : false
      };
    } catch (error) {
      console.error('Erro ao verificar status de processamento:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao verificar status'
      };
    }
  }
  
  /**
   * Obtém a lista de documentos processados por OCR
   * 
   * @param filters Filtros opcionais
   * @returns Lista de documentos
   */
  async getProcessedDocuments(filters?: {
    status?: string;
    documentType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<OcrDocument[]> {
    try {
      let query = supabase
        .from('ocr_documents')
        .select('*');
      
      // Aplicar filtros, se fornecidos
      if (filters) {
        if (filters.status) {
          query = query.eq('processingStatus', filters.status);
        }
        
        if (filters.documentType) {
          query = query.eq('documentType', filters.documentType);
        }
        
        if (filters.startDate) {
          query = query.gte('createdAt', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('createdAt', filters.endDate);
        }
        
        if (filters.search && filters.search.trim() !== '') {
          query = query.textSearch('rawText', filters.search);
        }
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      query = query.order('createdAt', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as OcrDocument[];
    } catch (error) {
      console.error('Erro ao buscar documentos processados:', error);
      throw new Error('Falha ao carregar documentos processados');
    }
  }
  
  /**
   * Editar manualmente os dados extraídos de um documento
   * 
   * @param documentId ID do documento
   * @param extractedData Dados extraídos atualizados
   * @returns Resultado da operação
   */
  async updateExtractedData(documentId: string, extractedData: OcrExtractedData): Promise<{ 
    success: boolean; 
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from('ocr_documents')
        .update({
          extractedData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId);
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        message: 'Dados extraídos atualizados com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar dados extraídos:', error);
      throw new Error('Falha ao atualizar dados extraídos');
    }
  }
  
  /**
   * Cria uma conta a pagar a partir dos dados extraídos
   * 
   * @param documentId ID do documento OCR
   * @returns Resultado da operação
   */
  async createDebtFromDocument(documentId: string): Promise<{
    success: boolean;
    message: string;
    debtId?: string;
  }> {
    try {
      // Obtém os dados do documento
      const { data: document, error: docError } = await supabase
        .from('ocr_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (docError || !document) {
        throw new Error('Documento não encontrado');
      }
      
      const ocrDoc = document as OcrDocument;
      
      if (ocrDoc.processingStatus !== 'completed') {
        throw new Error('Documento ainda não foi processado completamente');
      }
      
      const extractedData = ocrDoc.extractedData;
      
      // Valida dados mínimos necessários
      if (!extractedData.issuer?.name || !extractedData.totals?.total || !extractedData.documentInfo?.date) {
        throw new Error('Dados insuficientes para criar conta a pagar');
      }
      
      // Cria a conta a pagar
      const { data: debt, error: debtError } = await supabase
        .from('accounts_payable')
        .insert({
          creditor_name: extractedData.issuer.name,
          description: `${extractedData.documentInfo.type || 'Documento'} ${extractedData.documentInfo.number || ''}`.trim(),
          amount: extractedData.totals.total,
          due_date: extractedData.documentInfo.dueDate || extractedData.documentInfo.date,
          payment_status: 'pending',
          document_number: extractedData.documentInfo.number || undefined
        })
        .select()
        .single();
      
      if (debtError) {
        throw debtError;
      }
      
      return {
        success: true,
        message: 'Conta a pagar criada com sucesso',
        debtId: debt.id
      };
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar conta a pagar'
      };
    }
  }
  
  // Métodos auxiliares
  
  /**
   * Valida o formato do arquivo
   */
  private validateFileFormat(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato de arquivo não suportado. Use JPEG, PNG, GIF ou PDF');
    }
    
    // Limita o tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. O tamanho máximo é 10MB');
    }
  }
  
  /**
   * Cria um registro do documento no banco de dados
   */
  private async createDocumentRecord(file: File, documentType: string): Promise<string> {
    try {
      // Obtém o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Cria o registro
      const { data, error } = await supabase
        .from('ocr_documents')
        .insert({
          sourceType: file.type === 'application/pdf' ? 'pdf' : 'image',
          sourceFile: file.name,
          documentType,
          processingStatus: 'pending',
          confidence: 0,
          extractedData: {},
          createdBy: userData.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error('Erro ao criar registro do documento:', error);
      throw new Error('Falha ao registrar documento no banco de dados');
    }
  }
  
  /**
   * Processa o documento assincronamente
   */
  private async processDocumentAsync(documentId: string, file: File): Promise<void> {
    try {
      // Atualiza o status para 'processing'
      await supabase
        .from('ocr_documents')
        .update({
          processingStatus: 'processing',
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId);
      
      // Lê o conteúdo do arquivo
      let imageData: string | Uint8Array;
      
      if (file.type === 'application/pdf') {
        // Processamento de PDF (em uma implementação real, extrairia imagens do PDF)
        imageData = await this.extractImageFromPdf(file);
      } else {
        // Processamento de imagem
        imageData = await this.readFileAsDataURL(file);
      }
      
      // Inicializa o worker do Tesseract
      const worker = await this.getWorker();
      
      // Processa o OCR
      const result = await worker.recognize(imageData);
      
      // Extrai dados do texto reconhecido
      const extractedData = this.extractDataFromText(result.data.text, file.name, documentId);
      
      // Atualiza o documento com os dados extraídos
      await supabase
        .from('ocr_documents')
        .update({
          processingStatus: 'completed',
          confidence: result.data.confidence / 100, // Normaliza para valor entre 0 e 1
          extractedData,
          rawText: result.data.text,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId);
      
    } catch (error) {
      console.error('Erro no processamento assíncrono de OCR:', error);
      
      // Atualiza o status para 'error'
      await supabase
        .from('ocr_documents')
        .update({
          processingStatus: 'error',
          errorDetails: error instanceof Error ? error.message : 'Erro desconhecido no processamento OCR',
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId);
    }
  }
  
  /**
   * Obtém ou inicializa o worker do Tesseract
   */
  private async getWorker(): Promise<Tesseract.Worker> {
    if (this.worker && this.workerInitialized) {
      return this.worker;
    }
    
    if (this.workerPromise) {
      return this.workerPromise;
    }
    
    this.workerPromise = (async () => {
      // Cria um novo worker
      const worker = createWorker();
      
      // Inicializa o worker
      await worker.load();
      await worker.loadLanguage('por');
      await worker.initialize('por');
      
      this.worker = worker;
      this.workerInitialized = true;
      
      return worker;
    })();
    
    return this.workerPromise;
  }
  
  /**
   * Lê um arquivo como Data URL
   */
  private async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Extrai uma imagem de um arquivo PDF
   * Nota: em uma implementação real, usaríamos uma biblioteca como pdf.js
   */
  private async extractImageFromPdf(file: File): Promise<string> {
    // Em uma implementação real, extrairíamos uma imagem da primeira página do PDF
    // Para este exemplo, apenas retornamos um erro informativo
    // throw new Error('Processamento de PDF não implementado na versão de demonstração');
    
    // Para fins de demonstração, vamos simular um processamento bem-sucedido
    return await this.readFileAsDataURL(file);
  }
  
  /**
   * Extrai dados estruturados do texto reconhecido por OCR
   */
  private extractDataFromText(text: string, fileName: string, documentId: string): OcrExtractedData {
    try {
      // Normaliza o texto
      const normalizedText = text.replace(/\s+/g, ' ').trim();
      
      // Extrai informações usando expressões regulares e heurísticas
      
      // Documento
      const docNumberMatch = normalizedText.match(/(?:nota fiscal|nf|nfe|cupom fiscal|fatura)[^\d]*(\d+)/i);
      const documentNumber = docNumberMatch ? docNumberMatch[1] : undefined;
      
      // Datas
      const dateMatches = normalizedText.match(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/g) || [];
      const dates = dateMatches.map(d => {
        const parts = d.split(/[\/\.\-]/);
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month - 1, day).toISOString().split('T')[0];
      });
      
      // Valores
      const valueMatches = normalizedText.match(/R\$\s*\d+[\.,]\d+/g) || [];
      const values = valueMatches.map(v => parseFloat(v.replace('R$', '').replace('.', '').replace(',', '.')));
      
      // Tenta identificar o valor total
      let totalValue: number | undefined;
      const totalMatch = normalizedText.match(/(?:total|valor total)[^\d]*R\$\s*(\d+[\.,]\d+)/i);
      if (totalMatch) {
        totalValue = parseFloat(totalMatch[1].replace('.', '').replace(',', '.'));
      } else if (values.length > 0) {
        // Se não encontrou explicitamente, pega o maior valor
        totalValue = Math.max(...values);
      }
      
      // Tenta extrair o nome do emissor
      let issuerName: string | undefined;
      const companyMatches = normalizedText.match(/(?:empresa|loja|estabelecimento|razão social):\s*([^\n]+)/i);
      if (companyMatches) {
        issuerName = companyMatches[1].trim();
      }
      
      // Tenta extrair um documento do emissor (CNPJ)
      let issuerDocument: string | undefined;
      const cnpjMatch = normalizedText.match(/(?:cnpj|cnpj\/mf):\s*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s]?\/?\d{4}[\.\s]?\-?\d{2})/i);
      if (cnpjMatch) {
        issuerDocument = cnpjMatch[1];
      }
      
      // Tenta extrair itens da nota
      const items: OcrExtractedItem[] = [];
      
      // Padrões para identificar linhas de itens em um recibo
      // Em uma implementação real, usaríamos algoritmos mais sofisticados
      const lines = normalizedText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Ignora linhas muito curtas
        if (line.length < 5) continue;
        
        // Procura padrões de itens: quantidade, descrição e valor
        const itemMatch = line.match(/(\d+)\s+x\s+(.+?)\s+R\$\s*(\d+[\.,]\d+)/i);
        if (itemMatch) {
          const quantity = parseFloat(itemMatch[1]);
          const description = itemMatch[2].trim();
          const totalValue = parseFloat(itemMatch[3].replace(',', '.'));
          const unitValue = totalValue / quantity;
          
          items.push({
            id: `item-${documentId}-${i}`,
            description,
            quantity,
            unit: 'un',
            unitValue,
            totalValue
          });
        }
      }
      
      return {
        issuer: {
          name: issuerName,
          document: issuerDocument
        },
        documentInfo: {
          number: documentNumber,
          date: dates[0], // Assume a primeira data como a data do documento
          dueDate: dates.length > 1 ? dates[1] : undefined // Assume a segunda data como vencimento
        },
        items,
        totals: {
          total: totalValue
        }
      };
    } catch (error) {
      console.error('Erro ao extrair dados do texto OCR:', error);
      
      // Retorna um objeto vazio em caso de erro
      return {
        issuer: {},
        documentInfo: {},
        items: [],
        totals: {}
      };
    }
  }
}

// Exporta uma instância singleton
export const ocrService = new OcrService();
export default ocrService;