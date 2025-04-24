// Supabase Edge Function: OCR Processing API
// Fornece endpoints para processamento OCR de documentos não-fiscais

import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
// @ts-ignore: Import error in Deno
import { createWorker } from "npm:tesseract.js";
import { PDFDocument } from "npm:pdf-lib";

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
      // POST /ocr-processing/process
      if (path.length === 1 && path[0] === 'process') {
        // Verifica se a solicitação contém um arquivo
        const contentType = req.headers.get('Content-Type') || '';
        
        if (contentType.includes('multipart/form-data')) {
          const formData = await req.formData();
          const file = formData.get('file') as File;
          const documentType = formData.get('documentType') as string || 'other';
          
          if (!file) {
            return new Response(
              JSON.stringify({ error: 'Nenhum arquivo enviado' }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
          
          return await processOcrDocument(supabaseClient, file, documentType, user.id);
        } else {
          return new Response(
            JSON.stringify({ error: 'Formato de requisição inválido. Use multipart/form-data.' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    } else if (method === 'GET') {
      // GET /ocr-processing/documents
      if (path.length === 1 && path[0] === 'documents') {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const documentType = url.searchParams.get('documentType');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        return await getProcessedDocuments(supabaseClient, { status, documentType, startDate, endDate });
      }
      
      // GET /ocr-processing/documents/:id
      if (path.length === 2 && path[0] === 'documents') {
        const documentId = path[1];
        return await getDocumentById(supabaseClient, documentId);
      }
      
      // GET /ocr-processing/status/:id
      if (path.length === 2 && path[0] === 'status') {
        const documentId = path[1];
        return await checkProcessingStatus(supabaseClient, documentId);
      }
    } else if (method === 'PUT') {
      // PUT /ocr-processing/documents/:id
      if (path.length === 2 && path[0] === 'documents') {
        const documentId = path[1];
        const body = await req.json();
        
        if (!body.extractedData) {
          return new Response(
            JSON.stringify({ error: 'Dados extraídos não fornecidos' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await updateExtractedData(supabaseClient, documentId, body.extractedData);
      }
      
      // PUT /ocr-processing/documents/:id/debt
      if (path.length === 3 && path[0] === 'documents' && path[2] === 'debt') {
        const documentId = path[1];
        return await createDebtFromDocument(supabaseClient, documentId, user.id);
      }
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro na API de processamento OCR:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Implementações das funções da API

// Processa um documento para OCR
async function processOcrDocument(supabase, file: File, documentType: string, userId: string): Promise<Response> {
  try {
    // Verifica o formato do arquivo
    if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Formato de arquivo não suportado. Use JPEG, PNG, GIF ou PDF' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Limita o tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande. O tamanho máximo é 10MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Cria o registro do documento
    const { data: docData, error: docError } = await supabase
      .from('ocr_documents')
      .insert({
        sourceType: file.type === 'application/pdf' ? 'pdf' : 'image',
        sourceFile: file.name,
        documentType,
        processingStatus: 'pending',
        confidence: 0,
        extractedData: {},
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (docError) throw docError;
    
    const documentId = docData.id;
    
    // Faz upload do arquivo para o bucket Storage
    const filePath = `ocr/${documentId}/${file.name}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Atualiza o registro com o caminho do arquivo
    await supabase
      .from('ocr_documents')
      .update({
        sourceFile: filePath,
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
    
    // Inicia o processamento OCR em background
    EdgeRuntime.waitUntil(processOcrAsync(supabase, documentId, file, userId));
    
    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        status: 'pending',
        message: 'Documento enviado para processamento OCR'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro ao processar documento para OCR:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar documento', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Processa OCR de forma assíncrona
async function processOcrAsync(supabase, documentId: string, file: File, userId: string): Promise<void> {
  try {
    // Atualiza o status para 'processing'
    await supabase
      .from('ocr_documents')
      .update({
        processingStatus: 'processing',
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
      
    // Processa o arquivo dependendo do tipo
    let imageData;
    let rawText = '';
    let confidence = 0;
    
    if (file.type === 'application/pdf') {
      // Extrair primeira página do PDF como imagem
      // Nota: Em uma implementação real, processaríamos todas as páginas
      imageData = await extractImageFromPdf(file);
    } else {
      // Caso seja imagem, usa diretamente
      imageData = await file.arrayBuffer();
    }
    
    // Inicializa o worker do Tesseract
    const worker = await createWorker('por');
    
    // Processa o OCR
    const result = await worker.recognize(new Uint8Array(imageData));
    rawText = result.data.text;
    confidence = result.data.confidence / 100; // Normaliza para 0-1
    
    // Encerra o worker
    await worker.terminate();
    
    // Extrai dados estruturados do texto
    const extractedData = extractDataFromText(rawText, file.name, documentId);
    
    // Atualiza o documento com os dados extraídos
    await supabase
      .from('ocr_documents')
      .update({
        processingStatus: 'completed',
        confidence,
        extractedData,
        rawText,
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
      
    // Verifica se podemos criar automaticamente uma conta a pagar
    if (
      extractedData.issuer?.name && 
      extractedData.totals?.total && 
      extractedData.totals.total > 0 &&
      extractedData.documentInfo?.date
    ) {
      try {
        // Cria a conta a pagar
        await supabase
          .from('accounts_payable')
          .insert({
            creditor_name: extractedData.issuer.name,
            description: `${extractedData.documentInfo.type || 'Documento'} ${extractedData.documentInfo.number || ''}`.trim(),
            amount: extractedData.totals.total,
            due_date: extractedData.documentInfo.dueDate || extractedData.documentInfo.date,
            payment_status: 'pending',
            document_number: extractedData.documentInfo.number || undefined
          });
      } catch (debtError) {
        console.error('Erro ao criar conta a pagar automática:', debtError);
        // Não falhamos o processo principal se a criação da conta falhar
      }
    }
    
  } catch (error) {
    console.error('Erro no processamento OCR assíncrono:', error);
    
    // Atualiza o status para 'error'
    await supabase
      .from('ocr_documents')
      .update({
        processingStatus: 'error',
        errorDetails: error.message,
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
  }
}

// Extrai uma imagem da primeira página de um PDF
async function extractImageFromPdf(file: File): Promise<ArrayBuffer> {
  try {
    const fileBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBuffer);
    
    if (pdfDoc.getPageCount() === 0) {
      throw new Error('PDF sem páginas');
    }
    
    const page = pdfDoc.getPage(0);
    
    // Nota: Em uma implementação real, usaríamos uma biblioteca mais robusta
    // para renderizar o PDF como imagem. Aqui simulamos retornando o PDF original
    // já que no Edge Runtime temos limitações de bibliotecas.
    
    return fileBuffer;
  } catch (error) {
    console.error('Erro ao extrair imagem do PDF:', error);
    throw error;
  }
}

// Extrai dados estruturados do texto OCR
function extractDataFromText(text: string, fileName: string, documentId: string): any {
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
      
      // Usa formato ISO mas apenas a data (YYYY-MM-DD)
      try {
        return new Date(fullYear, month - 1, day).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    }).filter(d => d !== null);
    
    // Valores
    const valueMatches = normalizedText.match(/R\$\s*\d+[\.,]\d+/g) || [];
    const values = valueMatches.map(v => 
      parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    );
    
    // Tenta identificar o valor total
    let totalValue: number | undefined;
    const totalMatch = normalizedText.match(/(?:total|valor total|valor|total a pagar)[^\d]*R\$\s*(\d+[\.,]\d+)/i);
    if (totalMatch) {
      totalValue = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    } else if (values.length > 0) {
      // Se não encontrou explicitamente, pega o maior valor
      totalValue = Math.max(...values);
    }
    
    // Tenta extrair o nome do emissor
    let issuerName: string | undefined;
    const companyMatches = normalizedText.match(/(?:empresa|loja|estabelecimento|razão social|fornecedor|emitente):\s*([^\n]+)/i);
    if (companyMatches) {
      issuerName = companyMatches[1].trim();
    }
    
    // Tenta extrair um documento do emissor (CNPJ)
    let issuerDocument: string | undefined;
    const cnpjMatch = normalizedText.match(/(?:cnpj|cnpj\/mf):\s*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s]?\/?\d{4}[\.\s]?\-?\d{2})/i);
    if (cnpjMatch) {
      issuerDocument = cnpjMatch[1];
    }
    
    // Tenta extrair itens
    const items: any[] = [];
    
    // Padrões para identificar linhas de itens em um recibo
    // Em uma implementação real, usaríamos algoritmos mais sofisticados
    const lines = normalizedText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ignora linhas muito curtas
      if (line.length < 5) continue;
      
      // Procura padrões de itens: quantidade, descrição e valor
      const itemMatch = line.match(/(\d+)\s*x\s*(.+?)\s+R\$\s*(\d+[\.,]\d+)/i);
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

// Verifica o status de processamento de um documento
async function checkProcessingStatus(supabase, documentId: string): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('ocr_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: data.processingStatus !== 'error',
        documentId,
        status: data.processingStatus,
        message: data.processingStatus === 'error'
          ? data.errorDetails || 'Erro no processamento'
          : `Documento em status: ${data.processingStatus}`,
        extractedData: data.processingStatus === 'completed' ? data.extractedData : undefined
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao verificar status de processamento:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar status de processamento', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém documentos processados
async function getProcessedDocuments(supabase, filters: {
  status?: string;
  documentType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Response> {
  try {
    let query = supabase
      .from('ocr_documents')
      .select('*');
    
    // Aplicar filtros
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
    
    // Ordenar por data de criação (mais recente primeiro)
    query = query.order('createdAt', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao buscar documentos processados:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar documentos processados', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém um documento pelo ID
async function getDocumentById(supabase, documentId: string): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('ocr_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Gera URL temporária para download, se o documento estiver concluído
    let fileUrl = null;
    if (data.sourceFile && data.processingStatus === 'completed') {
      try {
        const { data: urlData } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(data.sourceFile, 60); // 1 minute expiration
          
        fileUrl = urlData?.signedUrl;
      } catch (urlError) {
        console.error('Erro ao gerar URL do arquivo:', urlError);
        // Não falha se não conseguir gerar URL
      }
    }
    
    return new Response(
      JSON.stringify({
        ...data,
        fileUrl
      }),
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

// Atualiza os dados extraídos de um documento
async function updateExtractedData(supabase, documentId: string, extractedData: any): Promise<Response> {
  try {
    const { error } = await supabase
      .from('ocr_documents')
      .update({
        extractedData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dados extraídos atualizados com sucesso'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao atualizar dados extraídos:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar dados extraídos', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Cria uma conta a pagar a partir de um documento OCR
async function createDebtFromDocument(supabase, documentId: string, userId: string): Promise<Response> {
  try {
    // Obtém os dados do documento
    const { data, error } = await supabase
      .from('ocr_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    if (data.processingStatus !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Documento ainda não foi processado completamente' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const extractedData = data.extractedData;
    
    // Valida dados mínimos necessários
    if (!extractedData.issuer?.name || !extractedData.totals?.total || !extractedData.documentInfo?.date) {
      return new Response(
        JSON.stringify({ error: 'Dados insuficientes para criar conta a pagar' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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
    
    if (debtError) throw debtError;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta a pagar criada com sucesso',
        debtId: debt.id
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao criar conta a pagar', details: error.message }),
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
    
    // Remover 'ocr-processing' do início do path, se presente
    if (path.length > 0 && path[0] === 'ocr-processing') {
      path.shift();
    }
    
    // Delegar para o handler apropriado
    return await handleRequest(req.method, path, req);
    
  } catch (error) {
    console.error('Erro na API de processamento OCR:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});