// Supabase Edge Function: Document Import API
// Fornece endpoints para importação e processamento de documentos fiscais

import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { XMLParser } from "npm:fast-xml-parser";
import * as pdfjs from "npm:pdfjs-dist";

// Configuração de CORS para permitir solicitações da origem do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey, X-Client-Info',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Lida com solicitações baseadas no method e path
const handleRequest = async (method: string, path: string[], req: Request): Promise<Response> => {
  // Obter o cliente Supabase usando as credenciais de serviço
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // Extrai o token JWT do header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Faltando token de autorização' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verifica o token JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Implementação das rotas
    if (method === 'POST') {
      // POST /document-import/xml
      if (path.length === 1 && path[0] === 'xml') {
        // Verifica se a solicitação contém um arquivo
        const contentType = req.headers.get('Content-Type') || '';
        
        if (contentType.includes('multipart/form-data')) {
          const formData = await req.formData();
          const xmlFile = formData.get('file') as File;
          
          if (!xmlFile) {
            return new Response(
              JSON.stringify({ error: 'Nenhum arquivo enviado' }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
          
          return await processXmlDocument(supabaseClient, xmlFile, user.id);
        } else {
          // Processamento de XML via JSON payload com string XML
          const body = await req.json();
          
          if (!body.xml) {
            return new Response(
              JSON.stringify({ error: 'Conteúdo XML não fornecido' }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
          
          return await processXmlString(supabaseClient, body.xml, user.id);
        }
      }
      
      // POST /document-import/url
      if (path.length === 1 && path[0] === 'url') {
        const body = await req.json();
        
        if (!body.url) {
          return new Response(
            JSON.stringify({ error: 'URL não fornecida' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await processXmlFromUrl(supabaseClient, body.url, user.id);
      }
    } else if (method === 'GET') {
      // GET /document-import/documents
      if (path.length === 1 && path[0] === 'documents') {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const search = url.searchParams.get('search');
        
        return await getImportedDocuments(supabaseClient, { status, startDate, endDate, search });
      }
      
      // GET /document-import/documents/:id
      if (path.length === 2 && path[0] === 'documents') {
        const documentId = path[1];
        return await getDocumentById(supabaseClient, documentId);
      }
    } else if (method === 'PUT') {
      // PUT /document-import/documents/:id/complete
      if (path.length === 3 && path[0] === 'documents' && path[2] === 'complete') {
        const documentId = path[1];
        return await completeImport(supabaseClient, documentId, user.id);
      }
      
      // PUT /document-import/documents/:id/mappings
      if (path.length === 3 && path[0] === 'documents' && path[2] === 'mappings') {
        const documentId = path[1];
        const body = await req.json();
        
        if (!body.mappings || !Array.isArray(body.mappings)) {
          return new Response(
            JSON.stringify({ error: 'Mapeamentos não fornecidos ou formato inválido' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await updateItemMappings(supabaseClient, documentId, body.mappings, user.id);
      }
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro na API de importação de documentos:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Implementações das funções da API

// Processa um arquivo XML enviado
async function processXmlDocument(supabase, file: File, userId: string): Promise<Response> {
  try {
    // Lê o conteúdo do arquivo
    const fileContent = await file.text();
    
    // Valida e processa o XML
    return await processXmlString(supabase, fileContent, userId);
    
  } catch (error) {
    console.error('Erro ao processar arquivo XML:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar arquivo XML', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Processa uma string XML
async function processXmlString(supabase, xmlContent: string, userId: string): Promise<Response> {
  try {
    // Valida o formato XML
    if (!xmlContent.trim().startsWith('<?xml') && !xmlContent.trim().startsWith('<')) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo XML inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Parse do XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
    });
    
    const result = parser.parse(xmlContent);
    
    // Identifica o tipo de documento
    let documentType = 'other';
    let docData = null;
    
    if (result.nfeProc?.NFe || result.NFe) {
      documentType = 'nfe';
      docData = result.nfeProc?.NFe || result.NFe;
    } else if (result.nfceProc?.NFCe || result.NFCe) {
      documentType = 'nfce';
      docData = result.nfceProc?.NFCe || result.NFCe;
    } else if (result.cteProc?.CTe || result.CTe) {
      documentType = 'cte';
      docData = result.cteProc?.CTe || result.CTe;
    }
    
    if (!docData) {
      return new Response(
        JSON.stringify({ error: 'Formato de documento fiscal não reconhecido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Extrai dados básicos do documento
    const infDoc = docData.infNFe || docData.infCTe;
    if (!infDoc) {
      return new Response(
        JSON.stringify({ error: 'Informações do documento não encontradas' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Emissor
    const emit = infDoc.emit || {};
    const emitName = emit.xNome || '';
    const emitCNPJ = emit.CNPJ || emit.CPF || '';
    
    // Dados do documento
    const ide = infDoc.ide || {};
    const documentNumber = ide.nNF || ide.nCT || '';
    const documentKey = infDoc['@_Id']?.replace(/^NFe/, '') || '';
    const documentDate = ide.dhEmi || '';
    
    // Valores
    let totalValue = 0;
    if (docData.infNFe?.total?.ICMSTot) {
      totalValue = parseFloat(docData.infNFe.total.ICMSTot.vNF || '0');
    }
    
    // Itens
    const items = [];
    if (docData.infNFe?.det) {
      const detItems = Array.isArray(docData.infNFe.det) ? docData.infNFe.det : [docData.infNFe.det];
      
      for (const item of detItems) {
        const prod = item.prod || {};
        items.push({
          productCode: prod.cProd || '',
          productDescription: prod.xProd || '',
          quantity: parseFloat(prod.qCom || '0'),
          unit: prod.uCom || '',
          unitValue: parseFloat(prod.vUnCom || '0'),
          totalValue: parseFloat(prod.vProd || '0'),
          ncm: prod.NCM || '',
          cfop: prod.CFOP || '',
          status: 'pending'
        });
      }
    }
    
    // Cria o registro de importação
    const { data: importData, error: importError } = await supabase
      .from('fiscal_document_imports')
      .insert({
        sourceType: 'xml',
        documentType,
        documentNumber,
        documentKey,
        documentDate: new Date(documentDate).toISOString(),
        issuerName: emitName,
        issuerDocument: emitCNPJ,
        totalValue,
        status: 'pending',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedInventory: false,
        updatedFinancial: false
      })
      .select()
      .single();
      
    if (importError) throw importError;
    
    const importId = importData.id;
    
    // Inserir os itens no banco
    for (const item of items) {
      const { error: itemError } = await supabase
        .from('fiscal_document_items')
        .insert({
          ...item,
          documentImportId: importId
        });
        
      if (itemError) throw itemError;
    }
    
    // Atualiza o status da importação para processamento
    await supabase
      .from('fiscal_document_imports')
      .update({
        status: 'processing',
        processingDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', importId);
    
    // Inicia o processo de correspondência de produtos em background
    EdgeRuntime.waitUntil(processDocumentItems(supabase, importId));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Documento importado com sucesso',
        importId,
        status: 'processing',
        documentType,
        documentNumber
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro ao processar string XML:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar documento XML', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Processa um documento XML a partir de uma URL
async function processXmlFromUrl(supabase, url: string, userId: string): Promise<Response> {
  try {
    // Faz o download do conteúdo da URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml'
      }
    });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Falha ao baixar o documento: ${response.status} ${response.statusText}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Lê o conteúdo como texto
    const xmlContent = await response.text();
    
    // Processa o XML
    return await processXmlString(supabase, xmlContent, userId);
    
  } catch (error) {
    console.error('Erro ao processar XML da URL:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar documento da URL', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Processa os itens do documento e tenta casar com produtos existentes
async function processDocumentItems(supabase, importId: string): Promise<void> {
  try {
    // Obtém os itens do documento
    const { data: items, error: itemsError } = await supabase
      .from('fiscal_document_items')
      .select('*')
      .eq('documentImportId', importId);
    
    if (itemsError) throw itemsError;
    
    // Para cada item, tenta encontrar o produto correspondente
    for (const item of items) {
      // Busca pelo código exato
      const { data: productMatch, error: matchError } = await supabase
        .from('products')
        .select('id, name')
        .or(`sku.eq.${item.productCode},barcode.eq.${item.productCode}`)
        .limit(1);
      
      if (matchError) {
        console.error(`Erro ao buscar correspondência para o item ${item.id}:`, matchError);
        continue;
      }
      
      if (productMatch && productMatch.length > 0) {
        // Correspondência exata encontrada
        await supabase
          .from('fiscal_document_items')
          .update({
            matchedProductId: productMatch[0].id,
            matchConfidence: 1, // Confiança máxima para correspondência exata
            status: 'matched'
          })
          .eq('id', item.id);
      } else {
        // Tenta busca por texto no nome do produto
        const { data: textMatch, error: textError } = await supabase
          .from('products')
          .select('id, name')
          .textSearch('name', item.productDescription.split(' ').slice(0, 3).join(' '));
        
        if (textError) {
          console.error(`Erro ao buscar correspondência por texto para o item ${item.id}:`, textError);
          continue;
        }
        
        if (textMatch && textMatch.length > 0) {
          // Correspondência por texto encontrada - calcula confiança
          const confidence = calculateSimilarity(textMatch[0].name, item.productDescription);
          
          await supabase
            .from('fiscal_document_items')
            .update({
              matchedProductId: confidence > 0.7 ? textMatch[0].id : null,
              matchConfidence: confidence,
              status: confidence > 0.7 ? 'matched' : 'pending'
            })
            .eq('id', item.id);
        }
      }
    }
    
    // Verifica o estado final dos itens
    const { data: finalItems, error: finalError } = await supabase
      .from('fiscal_document_items')
      .select('status')
      .eq('documentImportId', importId);
    
    if (finalError) throw finalError;
    
    const pendingItems = finalItems.filter(item => item.status === 'pending').length;
    const totalItems = finalItems.length;
    
    // Atualiza o status geral do documento
    const status = pendingItems === 0 ? 'validated' : 'processing';
    
    await supabase
      .from('fiscal_document_imports')
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', importId);
    
  } catch (error) {
    console.error('Erro ao processar itens do documento:', error);
    
    // Em caso de erro, marca o documento como erro
    await supabase
      .from('fiscal_document_imports')
      .update({
        status: 'error',
        errorDetails: error.message,
        updatedAt: new Date().toISOString()
      })
      .eq('id', importId);
  }
}

// Calcula similaridade entre duas strings
function calculateSimilarity(a: string, b: string): number {
  const aWords = a.toLowerCase().split(' ');
  const bWords = b.toLowerCase().split(' ');
  
  const intersection = aWords.filter(word => bWords.includes(word));
  const union = [...new Set([...aWords, ...bWords])];
  
  return intersection.length / union.length;
}

// Obtém documentos importados
async function getImportedDocuments(supabase, filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<Response> {
  try {
    let query = supabase
      .from('fiscal_document_imports')
      .select(`
        *,
        items:fiscal_document_items(*)
      `);
    
    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.startDate) {
      query = query.gte('documentDate', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('documentDate', filters.endDate);
    }
    
    if (filters.search) {
      query = query.or(`documentNumber.ilike.%${filters.search}%,issuerName.ilike.%${filters.search}%`);
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    query = query.order('createdAt', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao buscar documentos importados:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar documentos importados', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém um documento pelo ID
async function getDocumentById(supabase, documentId: string): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('fiscal_document_imports')
      .select(`
        *,
        items:fiscal_document_items(*)
      `)
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar documento', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Atualiza os mapeamentos de itens
async function updateItemMappings(supabase, documentId: string, mappings: Array<{itemId: string, productId: string}>, userId: string): Promise<Response> {
  try {
    // Verifica se a importação existe
    const { data: importData, error: importError } = await supabase
      .from('fiscal_document_imports')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (importError) throw importError;
    
    if (!importData) {
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Atualiza cada mapeamento
    for (const mapping of mappings) {
      const { error } = await supabase
        .from('fiscal_document_items')
        .update({
          matchedProductId: mapping.productId,
          matchConfidence: 1,
          status: 'matched',
          updatedAt: new Date().toISOString()
        })
        .eq('id', mapping.itemId)
        .eq('documentImportId', documentId);
        
      if (error) throw error;
    }
    
    // Verifica se todos os itens foram mapeados
    const { data: pendingItems, error: pendingError } = await supabase
      .from('fiscal_document_items')
      .select('count', { count: 'exact' })
      .eq('documentImportId', documentId)
      .eq('status', 'pending');
      
    if (pendingError) throw pendingError;
    
    const newStatus = pendingItems.length === 0 ? 'validated' : 'processing';
    
    // Atualiza o status do documento
    const { error: updateError } = await supabase
      .from('fiscal_document_imports')
      .update({
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
      
    if (updateError) throw updateError;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mapeamentos atualizados com sucesso',
        status: newStatus,
        remainingItems: pendingItems.length
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao atualizar mapeamentos:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar mapeamentos', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Completa a importação
async function completeImport(supabase, documentId: string, userId: string): Promise<Response> {
  try {
    // Verifica se a importação existe e está validada
    const { data: importData, error: importError } = await supabase
      .from('fiscal_document_imports')
      .select(`
        *,
        items:fiscal_document_items(*)
      `)
      .eq('id', documentId)
      .single();
      
    if (importError) throw importError;
    
    if (!importData) {
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    if (importData.status !== 'validated') {
      return new Response(
        JSON.stringify({ error: `Documento em status inválido: ${importData.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Atualiza o estoque
    let inventoryUpdated = false;
    let financialUpdated = false;
    
    // Código para atualização de estoque em uma implementação real
    // Exemplo simples:
    if (importData.documentType === 'nfe') {
      const matchedItems = importData.items.filter(item => item.status === 'matched' && item.matchedProductId);
      
      for (const item of matchedItems) {
        // Atualiza o estoque do produto
        const { error: stockError } = await supabase.rpc(
          'increase_product_stock',
          {
            product_id: item.matchedProductId,
            quantity: item.quantity
          }
        );
        
        if (stockError) throw stockError;
        
        // Registra a transação no histórico
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.matchedProductId,
            operation_type: 'purchase',
            quantity: item.quantity,
            reference_id: documentId,
            reference_type: 'fiscal_import',
            notes: `Importação de NF-e ${importData.documentNumber}`,
            created_by: userId
          });
          
        if (transactionError) throw transactionError;
      }
      
      inventoryUpdated = matchedItems.length > 0;
      
      // Cria uma conta a pagar
      const { error: payableError } = await supabase
        .from('accounts_payable')
        .insert({
          creditor_name: importData.issuerName,
          description: `NF-e ${importData.documentNumber}`,
          amount: importData.totalValue,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencimento em 30 dias
          payment_status: 'pending',
          document_number: importData.documentNumber
        });
        
      if (payableError) throw payableError;
      
      financialUpdated = true;
    }
    
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
      .eq('id', documentId);
      
    if (updateError) throw updateError;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Importação concluída com sucesso',
        inventoryUpdated,
        financialUpdated
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao concluir importação:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao concluir importação', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Handler principal da EdgeFunction
serve(async (req) => {
  // Lidar com solicitações OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse da URL para extrair o path
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Remover 'document-import' do início do path, se presente
    if (path.length > 0 && path[0] === 'document-import') {
      path.shift();
    }
    
    // Delegar para o handler apropriado
    return await handleRequest(req.method, path, req);
    
  } catch (error) {
    console.error('Erro na API de importação de documentos:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});