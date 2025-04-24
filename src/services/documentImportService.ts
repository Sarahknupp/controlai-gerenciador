import { FiscalDocumentImport, FiscalDocumentItem, FiscalDocumentValidationResult } from '../types/api';
import { xml2js } from 'xml2js';
import { supabase } from '../lib/supabase';
import { addDays, format } from 'date-fns';

/**
 * Serviço para importação automática de documentos fiscais
 */
export class DocumentImportService {
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms
  
  /**
   * Importa um documento fiscal a partir de um arquivo XML
   * 
   * @param file Arquivo XML a ser importado
   * @returns Resultado da importação
   */
  async importXmlFile(file: File): Promise<FiscalDocumentImport> {
    try {
      // Lê o conteúdo do arquivo
      const fileContent = await this.readFileAsText(file);
      
      // Valida o arquivo XML
      const validationResult = await this.validateXmlDocument(fileContent);
      
      if (!validationResult.isValid) {
        throw new Error(`Documento inválido: ${validationResult.errors[0]?.message}`);
      }
      
      // Extrai dados do XML
      const documentData = await this.parseXmlDocument(fileContent);
      
      // Cria o registro de importação no banco de dados
      const importId = await this.createImportRecord(documentData);
      
      // Processa os itens do documento
      await this.processDocumentItems(documentData.items, importId);
      
      // Atualiza o estoque se necessário
      if (documentData.documentType === 'nfe') {
        await this.updateInventory(importId);
      }
      
      // Retorna os dados da importação
      return await this.getImportById(importId);
    } catch (error) {
      console.error('Erro ao importar documento XML:', error);
      throw new Error(`Falha ao importar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Importa um documento fiscal a partir de uma URL
   * 
   * @param url URL do documento XML
   * @returns Resultado da importação
   */
  async importXmlFromUrl(url: string): Promise<FiscalDocumentImport> {
    try {
      // Faz o download do conteúdo da URL
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar o documento: ${response.status} ${response.statusText}`);
      }
      
      // Lê o conteúdo como texto
      const xmlContent = await response.text();
      
      // Valida o documento
      const validationResult = await this.validateXmlDocument(xmlContent);
      
      if (!validationResult.isValid) {
        throw new Error(`Documento inválido: ${validationResult.errors[0]?.message}`);
      }
      
      // Extrai dados do XML
      const documentData = await this.parseXmlDocument(xmlContent);
      
      // Cria o registro de importação no banco de dados
      const importId = await this.createImportRecord({
        ...documentData,
        sourceUrl: url
      });
      
      // Processa os itens do documento
      await this.processDocumentItems(documentData.items, importId);
      
      // Atualiza o estoque se necessário
      if (documentData.documentType === 'nfe') {
        await this.updateInventory(importId);
      }
      
      // Retorna os dados da importação
      return await this.getImportById(importId);
    } catch (error) {
      console.error('Erro ao importar documento XML a partir de URL:', error);
      throw new Error(`Falha ao importar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Importa múltiplos documentos fiscais
   * 
   * @param files Lista de arquivos XML a serem importados
   * @returns Resultado das importações
   */
  async importMultipleXmlFiles(files: File[]): Promise<{
    success: number;
    failed: number;
    results: Array<{ file: string, success: boolean, message: string, id?: string }>
  }> {
    const results = [];
    let success = 0;
    let failed = 0;
    
    // Processa cada arquivo
    for (const file of files) {
      try {
        const importResult = await this.importXmlFile(file);
        results.push({
          file: file.name,
          success: true,
          message: 'Importado com sucesso',
          id: importResult.id
        });
        success++;
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        failed++;
      }
    }
    
    return {
      success,
      failed,
      results
    };
  }
  
  /**
   * Obtém lista de documentos fiscais importados com filtros
   * 
   * @param filters Filtros para a busca
   * @returns Lista de documentos
   */
  async getImportedDocuments(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    documentType?: string;
    search?: string;
  }): Promise<FiscalDocumentImport[]> {
    try {
      let query = supabase
        .from('fiscal_document_imports')
        .select('*');
      
      // Aplicar filtros, se fornecidos
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.documentType) {
          query = query.eq('documentType', filters.documentType);
        }
        
        if (filters.startDate) {
          query = query.gte('documentDate', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('documentDate', filters.endDate);
        }
        
        if (filters.search) {
          query = query.or(
            `documentNumber.ilike.%${filters.search}%,issuerName.ilike.%${filters.search}%`
          );
        }
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      query = query.order('createdAt', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as FiscalDocumentImport[];
    } catch (error) {
      console.error('Erro ao buscar documentos importados:', error);
      throw new Error('Falha ao carregar documentos importados');
    }
  }
  
  /**
   * Valida manualmente o casamento de produtos em um documento importado
   * 
   * @param importId ID da importação
   * @param itemMappings Mapeamento de itens para produtos
   * @returns Resultado da validação
   */
  async validateItemMappings(importId: string, itemMappings: Array<{
    itemId: string;
    productId: string;
  }>): Promise<{ success: boolean; message: string }> {
    try {
      // Atualiza o mapeamento de cada item
      for (const mapping of itemMappings) {
        const { error } = await supabase
          .from('fiscal_document_items')
          .update({
            matchedProductId: mapping.productId,
            matchConfidence: 1, // Confiança máxima para mapeamento manual
            status: 'matched'
          })
          .eq('id', mapping.itemId)
          .eq('documentImportId', importId);
        
        if (error) {
          throw error;
        }
      }
      
      // Verifica se todos os itens foram mapeados
      const { data: items, error: countError } = await supabase
        .from('fiscal_document_items')
        .select('*')
        .eq('documentImportId', importId)
        .eq('status', 'pending');
      
      if (countError) {
        throw countError;
      }
      
      // Se todos os itens foram mapeados, atualiza o status da importação
      if (!items || items.length === 0) {
        const { error: updateError } = await supabase
          .from('fiscal_document_imports')
          .update({
            status: 'validated',
            updatedAt: new Date().toISOString()
          })
          .eq('id', importId);
        
        if (updateError) {
          throw updateError;
        }
      }
      
      return {
        success: true,
        message: 'Mapeamento de produtos validado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao validar mapeamento de itens:', error);
      throw new Error('Falha ao validar mapeamento de produtos');
    }
  }
  
  /**
   * Completa a importação e atualiza o estoque e o financeiro
   * 
   * @param importId ID da importação
   * @returns Resultado da operação
   */
  async completeImport(importId: string): Promise<{ 
    success: boolean; 
    message: string;
    inventoryUpdated: boolean;
    financialUpdated: boolean; 
  }> {
    try {
      // Verifica se a importação existe e está validada
      const { data: importData, error: importError } = await supabase
        .from('fiscal_document_imports')
        .select('*')
        .eq('id', importId)
        .single();
      
      if (importError || !importData) {
        throw new Error('Importação não encontrada');
      }
      
      if (importData.status !== 'validated') {
        throw new Error(`Importação em status inválido: ${importData.status}`);
      }
      
      // Atualiza o estoque
      const inventoryUpdated = await this.updateInventory(importId);
      
      // Atualiza o financeiro (se for uma nota de entrada)
      const financialUpdated = await this.updateFinancial(importId);
      
      // Atualiza o status da importação
      const { error: updateError } = await supabase
        .from('fiscal_document_imports')
        .update({
          status: 'imported',
          updatedInventory: inventoryUpdated,
          updatedFinancial: financialUpdated,
          importDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', importId);
      
      if (updateError) {
        throw updateError;
      }
      
      return {
        success: true,
        message: 'Importação concluída com sucesso',
        inventoryUpdated,
        financialUpdated
      };
    } catch (error) {
      console.error('Erro ao concluir importação:', error);
      throw new Error(`Falha ao concluir importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  // Métodos auxiliares
  
  /**
   * Lê um arquivo como texto
   */
  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Valida um documento XML
   */
  private async validateXmlDocument(xmlContent: string): Promise<FiscalDocumentValidationResult> {
    try {
      // Verifica se o XML é válido
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
      
      // Verifica se há erros de parsing
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        return {
          isValid: false,
          errors: [{ code: 'INVALID_XML', message: 'XML inválido ou mal-formado' }],
          warnings: []
        };
      }
      
      // Verifica se é um documento fiscal válido
      const nfeNode = xmlDoc.getElementsByTagName('NFe')[0];
      const nfceNode = xmlDoc.getElementsByTagName('NFCe')[0];
      const cteNode = xmlDoc.getElementsByTagName('CTe')[0];
      
      if (!nfeNode && !nfceNode && !cteNode) {
        return {
          isValid: false,
          errors: [{ code: 'INVALID_DOCUMENT', message: 'Documento fiscal não reconhecido' }],
          warnings: []
        };
      }
      
      // Extrai informações básicas para validação
      const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
      if (!infNFe) {
        return {
          isValid: false,
          errors: [{ code: 'MISSING_INFNFE', message: 'Tag infNFe não encontrada' }],
          warnings: []
        };
      }
      
      const chave = infNFe.getAttribute('Id')?.replace('NFe', '') || '';
      
      // Obtém o número do documento
      const nNF = xmlDoc.getElementsByTagName('nNF')[0]?.textContent || '';
      
      // Obtém a data de emissão
      const dhEmi = xmlDoc.getElementsByTagName('dhEmi')[0]?.textContent || '';
      
      // Validação completa
      return {
        isValid: true,
        documentKey: chave,
        documentNumber: nNF,
        issueDate: dhEmi,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('Erro ao validar documento XML:', error);
      return {
        isValid: false,
        errors: [{ 
          code: 'VALIDATION_ERROR', 
          message: error instanceof Error ? error.message : 'Erro ao validar o documento' 
        }],
        warnings: []
      };
    }
  }
  
  /**
   * Analisa um documento XML e extrai seus dados
   */
  private async parseXmlDocument(xmlContent: string): Promise<Omit<FiscalDocumentImport, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> {
    try {
      // Converte XML para JS usando xml2js
      const result: any = await new Promise((resolve, reject) => {
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        parser.parseString(xmlContent, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      // Determina o tipo de documento
      let documentType: 'nfe' | 'nfce' | 'cte' | 'mdfe' | 'other' = 'other';
      let rootNode: any;
      let items: any[] = [];
      
      if (result.NFe) {
        documentType = 'nfe';
        rootNode = result.NFe;
      } else if (result.NFCe) {
        documentType = 'nfce';
        rootNode = result.NFCe;
      } else if (result.CTe) {
        documentType = 'cte';
        rootNode = result.CTe;
      } else if (result.MDFe) {
        documentType = 'mdfe';
        rootNode = result.MDFe;
      } else {
        throw new Error('Tipo de documento não reconhecido');
      }
      
      // Extrai os dados básicos do documento
      const infDoc = rootNode.infNFe || rootNode.infCte || rootNode.infMDFe;
      if (!infDoc) {
        throw new Error('Informações do documento não encontradas');
      }
      
      // Obtém dados do emissor
      const emit = infDoc.emit || {};
      const emitName = emit.xNome || '';
      const emitCNPJ = emit.CNPJ || emit.CPF || '';
      
      // Obtém dados do documento
      const ide = infDoc.ide || {};
      const documentNumber = ide.nNF || ide.nCT || ide.nMDF || '';
      const documentKey = infDoc.Id?.replace('NFe', '') || '';
      const documentDate = ide.dhEmi || ide.dhSaiEnt || '';
      
      // Obtém dados de valor
      const total = infDoc.total?.ICMSTot || {};
      const totalValue = parseFloat(total.vNF || '0') || 0;
      
      // Extrai itens para NF-e/NFC-e
      if (documentType === 'nfe' || documentType === 'nfce') {
        // Verifica se há itens (det) e se é um array
        const det = infDoc.det;
        if (det) {
          // Se for um único item, converte para array
          const detArray = Array.isArray(det) ? det : [det];
          
          items = detArray.map((item: any) => {
            const prod = item.prod || {};
            return {
              productCode: prod.cProd || '',
              productDescription: prod.xProd || '',
              quantity: parseFloat(prod.qCom || '0') || 0,
              unit: prod.uCom || '',
              unitValue: parseFloat(prod.vUnCom || '0') || 0,
              totalValue: parseFloat(prod.vProd || '0') || 0,
              ncm: prod.NCM || '',
              cfop: prod.CFOP || '',
              cest: prod.CEST || '',
              status: 'pending'
            };
          });
        }
      }
      
      return {
        sourceType: 'xml',
        documentType,
        documentNumber,
        documentKey,
        documentDate: documentDate ? new Date(documentDate).toISOString() : new Date().toISOString(),
        issuerName: emitName,
        issuerDocument: emitCNPJ,
        totalValue,
        status: 'pending',
        items: items as FiscalDocumentItem[],
        updatedInventory: false,
        updatedFinancial: false
      };
    } catch (error) {
      console.error('Erro ao analisar documento XML:', error);
      throw new Error(`Falha ao processar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Cria um registro de importação no banco de dados
   */
  private async createImportRecord(documentData: Omit<FiscalDocumentImport, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    try {
      // Obtém o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Cria o registro de importação
      const { data, error } = await supabase
        .from('fiscal_document_imports')
        .insert({
          ...documentData,
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
      console.error('Erro ao criar registro de importação:', error);
      throw new Error('Falha ao registrar importação no banco de dados');
    }
  }
  
  /**
   * Processa os itens do documento e tenta casar com produtos do cadastro
   */
  private async processDocumentItems(items: FiscalDocumentItem[], importId: string): Promise<void> {
    try {
      // Para cada item, tenta encontrar o produto correspondente
      for (const item of items) {
        // Busca pelo código exato
        const { data: productMatch, error: matchError } = await supabase
          .from('products')
          .select('id')
          .or(`sku.eq.${item.productCode},barcode.eq.${item.productCode}`)
          .limit(1);
        
        if (matchError) {
          throw matchError;
        }
        
        // Se encontrou um produto, atualiza o item
        if (productMatch && productMatch.length > 0) {
          await supabase
            .from('fiscal_document_items')
            .insert({
              ...item,
              documentImportId: importId,
              matchedProductId: productMatch[0].id,
              matchConfidence: 1, // Correspondência exata
              status: 'matched'
            });
        } else {
          // Tenta busca por aproximação de texto usando o nome
          const { data: fuzzyMatch, error: fuzzyError } = await supabase
            .from('products')
            .select('id, name')
            .textSearch('name', item.productDescription.split(' ').slice(0, 3).join(' '));
          
          if (fuzzyError) {
            throw fuzzyError;
          }
          
          // Se encontrou possíveis correspondências
          if (fuzzyMatch && fuzzyMatch.length > 0) {
            // Calcula a confiança com um algoritmo simples de similaridade (em uma implementação real, seria mais sofisticado)
            const confidence = this.calculateSimilarity(fuzzyMatch[0].name, item.productDescription);
            
            await supabase
              .from('fiscal_document_items')
              .insert({
                ...item,
                documentImportId: importId,
                matchedProductId: confidence > 0.7 ? fuzzyMatch[0].id : undefined,
                matchConfidence: confidence,
                status: confidence > 0.7 ? 'matched' : 'pending'
              });
          } else {
            // Não encontrou correspondência
            await supabase
              .from('fiscal_document_items')
              .insert({
                ...item,
                documentImportId: importId,
                status: 'pending'
              });
          }
        }
      }
      
      // Atualiza o status da importação
      await supabase
        .from('fiscal_document_imports')
        .update({
          status: 'processing',
          processingDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', importId);
    } catch (error) {
      console.error('Erro ao processar itens do documento:', error);
      throw new Error('Falha ao processar itens do documento');
    }
  }
  
  /**
   * Calcula a similaridade entre duas strings
   * (algoritmo simples para demonstração - em produção usaria algo mais robusto como Levenshtein ou TF-IDF)
   */
  private calculateSimilarity(a: string, b: string): number {
    const aWords = a.toLowerCase().split(' ');
    const bWords = b.toLowerCase().split(' ');
    
    const intersection = aWords.filter(word => bWords.includes(word));
    const union = [...new Set([...aWords, ...bWords])];
    
    return intersection.length / union.length;
  }
  
  /**
   * Atualiza o estoque com base nos produtos importados
   */
  private async updateInventory(importId: string): Promise<boolean> {
    try {
      // Obtém os itens do documento
      const { data: items, error: itemsError } = await supabase
        .from('fiscal_document_items')
        .select('*')
        .eq('documentImportId', importId)
        .eq('status', 'matched');
      
      if (itemsError) {
        throw itemsError;
      }
      
      if (!items || items.length === 0) {
        return false; // Nada para atualizar
      }
      
      // Obtém o tipo de documento
      const { data: importData, error: importError } = await supabase
        .from('fiscal_document_imports')
        .select('documentType')
        .eq('id', importId)
        .single();
      
      if (importError) {
        throw importError;
      }
      
      // Determina o tipo de operação (entrada/saída)
      const isEntryOperation = importData.documentType === 'nfe'; // Simplificação para exemplo
      
      // Atualiza o estoque de cada item
      for (const item of items) {
        if (!item.matchedProductId) continue;
        
        // Em uma entrada, aumentamos o estoque; em uma saída, diminuímos
        const quantityChange = isEntryOperation ? item.quantity : -item.quantity;
        
        // Atualiza o estoque do produto
        const { error: updateError } = await supabase.rpc(
          isEntryOperation ? 'increase_product_stock' : 'decrease_product_stock',
          {
            product_id: item.matchedProductId,
            quantity: Math.abs(quantityChange)
          }
        );
        
        if (updateError) {
          throw updateError;
        }
        
        // Registra a transação no histórico
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.matchedProductId,
            operation_type: isEntryOperation ? 'purchase' : 'sale',
            quantity: Math.abs(quantityChange),
            reference_id: importId,
            reference_type: 'fiscal_import',
            notes: `Importação de documento fiscal ${importData.documentType.toUpperCase()}`
          });
        
        if (transactionError) {
          throw transactionError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw new Error('Falha ao atualizar estoque');
    }
  }
  
  /**
   * Atualiza o financeiro com base no documento importado
   */
  private async updateFinancial(importId: string): Promise<boolean> {
    try {
      // Obtém os dados da importação
      const { data: importData, error: importError } = await supabase
        .from('fiscal_document_imports')
        .select('*')
        .eq('id', importId)
        .single();
      
      if (importError) {
        throw importError;
      }
      
      // Somente cria contas a pagar para notas de entrada
      if (importData.documentType !== 'nfe') {
        return false;
      }
      
      // Cria uma conta a pagar
      const dueDate = addDays(new Date(importData.documentDate), 30); // Vencimento padrão em 30 dias
      
      const { error: payableError } = await supabase
        .from('accounts_payable')
        .insert({
          creditor_name: importData.issuerName,
          description: `Nota Fiscal ${importData.documentNumber}`,
          amount: importData.totalValue,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          payment_status: 'pending',
          document_number: importData.documentNumber
        });
      
      if (payableError) {
        throw payableError;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar financeiro:', error);
      throw new Error('Falha ao atualizar financeiro');
    }
  }
  
  /**
   * Obtém os detalhes de uma importação pelo ID
   */
  private async getImportById(importId: string): Promise<FiscalDocumentImport> {
    try {
      const { data, error } = await supabase
        .from('fiscal_document_imports')
        .select(`
          *,
          items:fiscal_document_items(*)
        `)
        .eq('id', importId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as FiscalDocumentImport;
    } catch (error) {
      console.error('Erro ao obter importação:', error);
      throw new Error('Falha ao obter detalhes da importação');
    }
  }
}

// Exportar uma instância singleton
export const documentImportService = new DocumentImportService();
export default documentImportService;