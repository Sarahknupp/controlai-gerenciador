import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  ChevronLeft,
  Search, 
  Filter,
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Image,
  RefreshCw,
  Info,
  X,
  Eye,
  Edit,
  Download,
  DollarSign,
  Upload
} from 'lucide-react';
import { OcrDocument, OcrProcessingResult, OcrExtractedData } from '../../types/api';
import { ocrService } from '../../services/ocrService';

/**
 * Página de processamento OCR de documentos não fiscais
 */
const OcrProcessor: React.FC = () => {
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documents, setDocuments] = useState<OcrDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<OcrDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<OcrDocument | null>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Buscar documentos ao inicializar
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Filtrar documentos quando os filtros ou busca mudam
  useEffect(() => {
    if (!documents) return;
    
    let filtered = [...documents];
    
    // Aplicar filtro de status
    if (statusFilter) {
      filtered = filtered.filter(doc => doc.processingStatus === statusFilter);
    }
    
    // Aplicar filtro de tipo
    if (documentTypeFilter) {
      filtered = filtered.filter(doc => doc.documentType === documentTypeFilter);
    }
    
    // Aplicar busca (em um cenário real, faríamos busca em texto completo no backend)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.sourceFile.toLowerCase().includes(query) || 
        (doc.rawText && doc.rawText.toLowerCase().includes(query))
      );
    }
    
    setFilteredDocuments(filtered);
  }, [documents, statusFilter, documentTypeFilter, searchQuery]);
  
  // Buscar lista de documentos
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await ocrService.getProcessedDocuments();
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar documentos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Processar um novo documento
  const handleProcessDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Obtém o tipo de documento (poderia ser selecionado pelo usuário)
      const documentType = files[0].name.toLowerCase().includes('receipt') 
        ? 'receipt' 
        : files[0].name.toLowerCase().includes('invoice') 
          ? 'invoice' 
          : 'other';
      
      // Processa o documento
      const result = await ocrService.processDocument(files[0], documentType as any);
      
      if (result.success) {
        setSuccess(`Documento enviado para processamento. ID: ${result.documentId}`);
        
        // Recarregar lista de documentos após um breve delay
        setTimeout(() => {
          fetchDocuments();
        }, 1000);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento');
    } finally {
      setIsProcessing(false);
      // Limpar o input
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  // Verificar status de processamento
  const checkProcessingStatus = async (documentId: string) => {
    try {
      const result = await ocrService.checkProcessingStatus(documentId);
      
      if (result.status === 'completed') {
        // Recarregar documentos para obter dados atualizados
        await fetchDocuments();
        
        // Atualizar documento selecionado se for o mesmo
        if (selectedDocument && selectedDocument.id === documentId) {
          const updatedDoc = documents.find(d => d.id === documentId);
          if (updatedDoc) {
            setSelectedDocument(updatedDoc);
          }
        }
        
        setSuccess('Processamento concluído com sucesso!');
      } else if (result.status === 'error') {
        setError(`Erro no processamento: ${result.message}`);
      } else {
        // Ainda em processamento
        setSuccess(`Status: ${result.status} - ${result.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar status');
    }
  };
  
  // Criar conta a pagar a partir do documento
  const createDebtFromDocument = async (documentId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await ocrService.createDebtFromDocument(documentId);
      
      if (result.success) {
        setSuccess(`Conta a pagar criada com sucesso. ID: ${result.debtId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta a pagar');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Atualizar dados extraídos
  const updateExtractedData = async (documentId: string, data: OcrExtractedData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ocrService.updateExtractedData(documentId, data);
      setSuccess('Dados extraídos atualizados com sucesso');
      
      // Recarregar lista de documentos
      await fetchDocuments();
      
      // Atualizar documento selecionado
      const updatedDoc = documents.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument({...updatedDoc, extractedData: data});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Formatar valor monetário
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatar porcentagem de confiança
  const formatConfidence = (confidence?: number) => {
    if (confidence === undefined || confidence === null) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Renderizar badge de status
  const renderStatusBadge = (status: string, confidence?: number) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-gray-100 text-gray-800">Aguardando</span>;
      case 'processing':
        return <span className="badge bg-blue-100 text-blue-800">Processando</span>;
      case 'completed':
        return (
          <span className="badge bg-green-100 text-green-800" title={`Confiança: ${formatConfidence(confidence)}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </span>
        );
      case 'error':
        return <span className="badge bg-red-100 text-red-800">Erro</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ChevronLeft 
            className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
            onClick={() => window.history.back()}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Processador OCR de Documentos</h1>
            <p className="text-gray-500">Extraia dados de notas, recibos e faturas automaticamente</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <label className="btn-primary cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Processar Documento
            <input 
              type="file" 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.pdf" 
              ref={fileInputRef}
              onChange={handleProcessDocument}
              disabled={isProcessing}
            />
          </label>
          <button 
            className="btn-outline"
            onClick={fetchDocuments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <X className="h-5 w-5 text-green-500" />
          </button>
        </div>
      )}

      {/* Filtros e busca */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder="Buscar nos documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="input py-2"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">Todos os status</option>
            <option value="pending">Aguardando</option>
            <option value="processing">Processando</option>
            <option value="completed">Concluído</option>
            <option value="error">Erro</option>
          </select>
          <select
            className="input py-2"
            value={documentTypeFilter || ''}
            onChange={(e) => setDocumentTypeFilter(e.target.value || null)}
          >
            <option value="">Todos os tipos</option>
            <option value="receipt">Recibo</option>
            <option value="invoice">Fatura</option>
            <option value="bill">Conta</option>
            <option value="other">Outro</option>
          </select>
          <button 
            className="btn-outline py-2"
            onClick={() => {
              setStatusFilter(null);
              setDocumentTypeFilter(null);
              setSearchQuery('');
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de documentos e detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de documentos */}
        <div className="lg:col-span-1 border rounded-lg bg-white overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Documentos Processados</h2>
          </div>
          
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                <span className="ml-2">Carregando...</span>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="divide-y">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedDocument?.id === doc.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                    onClick={() => {
                      setSelectedDocument(doc);
                      setShowExtractedData(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.sourceFile.split('/').pop()}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {doc.documentType === 'receipt' ? 'Recibo' : 
                          doc.documentType === 'invoice' ? 'Fatura' :
                          doc.documentType === 'bill' ? 'Conta' : 'Outro'}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                      <div>
                        {renderStatusBadge(doc.processingStatus, doc.confidence)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <FileText className="h-8 w-8 mb-2" />
                <p>Nenhum documento encontrado</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Detalhes do documento */}
        <div className="lg:col-span-2 border rounded-lg bg-white overflow-hidden">
          {selectedDocument ? (
            <div>
              {/* Cabeçalho */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-lg flex items-center">
                    {selectedDocument.sourceType === 'pdf' ? (
                      <FileText className="h-5 w-5 text-primary mr-2" />
                    ) : (
                      <Image className="h-5 w-5 text-primary mr-2" />
                    )}
                    {selectedDocument.sourceFile.split('/').pop()}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {renderStatusBadge(selectedDocument.processingStatus, selectedDocument.confidence)}
                    
                    {/* Opções de visualização */}
                    <div className="ml-2 bg-gray-100 rounded-md flex">
                      <button 
                        className={`p-1.5 rounded-l-md ${!showExtractedData ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setShowExtractedData(false)}
                        title="Visualizar documento"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className={`p-1.5 rounded-r-md ${showExtractedData ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setShowExtractedData(true)}
                        title="Visualizar dados extraídos"
                        disabled={selectedDocument.processingStatus !== 'completed'}
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo do documento */}
              <div className="p-6">
                {!showExtractedData ? (
                  // Visualização do documento
                  <div>
                    {/* Status do processamento */}
                    <div className="mb-4">
                      {selectedDocument.processingStatus === 'pending' && (
                        <div className="bg-yellow-50 p-4 rounded-lg flex items-center">
                          <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                          <div>
                            <p className="font-medium text-yellow-800">Documento aguardando processamento</p>
                            <p className="text-yellow-700 text-sm mt-1">
                              O documento está na fila e será processado em breve.
                            </p>
                            <button 
                              className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 flex items-center"
                              onClick={() => checkProcessingStatus(selectedDocument.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Verificar status
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedDocument.processingStatus === 'processing' && (
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                          <RefreshCw className="h-5 w-5 text-blue-600 mr-3 animate-spin" />
                          <div>
                            <p className="font-medium text-blue-800">Processando documento</p>
                            <p className="text-blue-700 text-sm mt-1">
                              O documento está sendo processado pelo sistema OCR.
                            </p>
                            <button 
                              className="mt-2 text-sm font-medium text-blue-800 hover:text-blue-900 flex items-center"
                              onClick={() => checkProcessingStatus(selectedDocument.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Atualizar status
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedDocument.processingStatus === 'error' && (
                        <div className="bg-red-50 p-4 rounded-lg flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">Erro no processamento</p>
                            <p className="text-red-700 text-sm mt-1">
                              {selectedDocument.errorDetails || 'Ocorreu um erro durante o processamento do documento.'}
                            </p>
                            <button 
                              className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 flex items-center"
                              onClick={() => {
                                // Aqui poderíamos implementar uma função de reprocessamento
                                alert('Função de reprocessamento não implementada nesta versão');
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Tentar novamente
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Previsualização do documento */}
                    <div className="mt-4 mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Visualização do Documento</h3>
                      {/* Aqui seria uma visualização do documento, por limitação exibiremos apenas texto em produção */}
                      <div className="border rounded-lg p-6 bg-gray-50 max-h-96 overflow-auto">
                        {selectedDocument.rawText ? (
                          <pre className="text-xs font-mono whitespace-pre-wrap">{selectedDocument.rawText}</pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32">
                            <FileText className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">Texto não disponível</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Informações do documento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Informações do Documento</h3>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Tipo:</p>
                              <p className="font-medium capitalize">
                                {selectedDocument.documentType === 'receipt' ? 'Recibo' : 
                                selectedDocument.documentType === 'invoice' ? 'Fatura' :
                                selectedDocument.documentType === 'bill' ? 'Conta' : 'Outro'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Formato:</p>
                              <p className="font-medium uppercase">{selectedDocument.sourceType}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Processado em:</p>
                              <p className="font-medium">{formatDate(selectedDocument.updatedAt)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Confiança:</p>
                              <p className="font-medium">{formatConfidence(selectedDocument.confidence)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedDocument.processingStatus === 'completed' && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Dados Extraídos</h3>
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="space-y-3">
                              {selectedDocument.extractedData.issuer?.name && (
                                <div>
                                  <p className="text-xs text-gray-500">Emissor:</p>
                                  <p className="font-medium">{selectedDocument.extractedData.issuer.name}</p>
                                </div>
                              )}
                              
                              {selectedDocument.extractedData.documentInfo?.date && (
                                <div>
                                  <p className="text-xs text-gray-500">Data:</p>
                                  <p className="font-medium">{selectedDocument.extractedData.documentInfo.date}</p>
                                </div>
                              )}
                              
                              {selectedDocument.extractedData.totals?.total && (
                                <div>
                                  <p className="text-xs text-gray-500">Valor Total:</p>
                                  <p className="font-medium">{formatCurrency(selectedDocument.extractedData.totals.total)}</p>
                                </div>
                              )}
                              
                              <button 
                                className="text-primary text-sm flex items-center"
                                onClick={() => setShowExtractedData(true)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Ver todos os dados
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Ações disponíveis */}
                    <div className="mt-6 flex justify-end">
                      {selectedDocument.processingStatus === 'completed' && (
                        <>
                          <button 
                            className="btn-outline mr-3"
                            onClick={() => setShowExtractedData(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Dados
                          </button>
                          <button 
                            className="btn-primary"
                            onClick={() => createDebtFromDocument(selectedDocument.id)}
                            disabled={isLoading}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Criar Conta a Pagar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  // Visualização dos dados extraídos
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Dados Extraídos</h3>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setShowExtractedData(false)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {selectedDocument.extractedData && (
                      <div className="space-y-6">
                        {/* Emissor */}
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3">Dados do Emissor</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500">Nome/Razão Social</label>
                              <input 
                                type="text" 
                                className="input mt-1 w-full" 
                                value={selectedDocument.extractedData.issuer?.name || ''} 
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">CPF/CNPJ</label>
                              <input 
                                type="text" 
                                className="input mt-1 w-full" 
                                value={selectedDocument.extractedData.issuer?.document || ''} 
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Documento */}
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3">Informações do Documento</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500">Número</label>
                              <input 
                                type="text" 
                                className="input mt-1 w-full" 
                                value={selectedDocument.extractedData.documentInfo?.number || ''} 
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Data</label>
                              <input 
                                type="text" 
                                className="input mt-1 w-full" 
                                value={selectedDocument.extractedData.documentInfo?.date || ''} 
                                readOnly
                              />
                            </div>
                            {selectedDocument.extractedData.documentInfo?.dueDate && (
                              <div>
                                <label className="block text-xs text-gray-500">Data de Vencimento</label>
                                <input 
                                  type="text" 
                                  className="input mt-1 w-full" 
                                  value={selectedDocument.extractedData.documentInfo.dueDate} 
                                  readOnly
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Valores */}
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3">Valores</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {selectedDocument.extractedData.totals?.subtotal !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-500">Subtotal</label>
                                <input 
                                  type="text" 
                                  className="input mt-1 w-full" 
                                  value={formatCurrency(selectedDocument.extractedData.totals?.subtotal)} 
                                  readOnly
                                />
                              </div>
                            )}
                            
                            {selectedDocument.extractedData.totals?.tax !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-500">Impostos</label>
                                <input 
                                  type="text" 
                                  className="input mt-1 w-full" 
                                  value={formatCurrency(selectedDocument.extractedData.totals?.tax)} 
                                  readOnly
                                />
                              </div>
                            )}
                            
                            {selectedDocument.extractedData.totals?.discount !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-500">Descontos</label>
                                <input 
                                  type="text" 
                                  className="input mt-1 w-full" 
                                  value={formatCurrency(selectedDocument.extractedData.totals?.discount)} 
                                  readOnly
                                />
                              </div>
                            )}
                            
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-500">Total</label>
                              <input 
                                type="text" 
                                className="input mt-1 w-full text-lg font-bold" 
                                value={formatCurrency(selectedDocument.extractedData.totals?.total)} 
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Itens */}
                        {selectedDocument.extractedData.items && selectedDocument.extractedData.items.length > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <h4 className="font-medium mb-3">Itens do Documento</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                  <tr>
                                    <th className="px-3 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                    <th className="px-3 py-3 bg-gray-100 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                                    <th className="px-3 py-3 bg-gray-100 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                                    <th className="px-3 py-3 bg-gray-100 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {selectedDocument.extractedData.items.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 text-sm">{item.description}</td>
                                      <td className="px-3 py-2 text-sm text-right">{item.quantity} {item.unit}</td>
                                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.unitValue)}</td>
                                      <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.totalValue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        {/* Ações */}
                        <div className="flex justify-end space-x-3">
                          <button 
                            className="btn-outline"
                            onClick={() => setShowExtractedData(false)}
                          >
                            Voltar
                          </button>
                          <button 
                            className="btn-primary"
                            onClick={() => createDebtFromDocument(selectedDocument.id)}
                            disabled={isLoading}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Criar Conta a Pagar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <FileText className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum documento selecionado</h3>
              <p className="text-center max-w-md">
                Selecione um documento na lista ao lado para ver seus detalhes ou processe um novo documento usando o botão acima.
              </p>
              <button 
                className="mt-4 btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Processar Novo Documento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrProcessor;