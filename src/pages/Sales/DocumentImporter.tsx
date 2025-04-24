import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  ChevronLeft, 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Download,
  RefreshCw,
  Link,
  FileUp,
  Eye
} from 'lucide-react';
import { FiscalDocumentImport, FiscalDocumentValidationResult } from '../../types/api';
import { documentImportService } from '../../services/documentImportService';

/**
 * Página de importação de documentos fiscais
 */
const DocumentImporter: React.FC = () => {
  // Estados da página
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [documents, setDocuments] = useState<FiscalDocumentImport[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<FiscalDocumentImport[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<FiscalDocumentImport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<FiscalDocumentValidationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [urlToImport, setUrlToImport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Buscar documentos na inicialização
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtrar documentos quando o filtro ou busca mudar
  useEffect(() => {
    if (!documents) return;

    let filtered = [...documents];

    // Aplicar filtro de status
    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Aplicar busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentNumber.toLowerCase().includes(query) || 
        doc.issuerName.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, statusFilter, searchQuery]);

  // Buscar documentos
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await documentImportService.getImportedDocuments();
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  // Fazer upload de documentos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (files.length === 1) {
        // Upload de um único arquivo
        await documentImportService.importXmlFile(files[0]);
        setSuccess(`Documento "${files[0].name}" importado com sucesso`);
      } else {
        // Upload de múltiplos arquivos
        const result = await documentImportService.importMultipleXmlFiles(Array.from(files));
        setSuccess(`Importação concluída: ${result.success} sucesso, ${result.failed} falhas`);
      }
      
      // Recarregar lista de documentos
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar documentos');
    } finally {
      setUploadingFiles(false);
      // Limpar o input de arquivo
      event.target.value = '';
    }
  };

  // Importar documento a partir de URL
  const handleUrlImport = async () => {
    if (!urlToImport.trim()) {
      setError('URL não pode ser vazia');
      return;
    }

    setUploadingFiles(true);
    setError(null);
    setSuccess(null);
    
    try {
      await documentImportService.importXmlFromUrl(urlToImport);
      setSuccess(`Documento da URL importado com sucesso`);
      setUrlToImport('');
      setShowModal(false);
      
      // Recarregar lista de documentos
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar documento da URL');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Completar importação e atualizar estoque/financeiro
  const handleCompleteImport = async (docId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await documentImportService.completeImport(docId);
      setSuccess(`Importação concluída com sucesso. Estoque ${result.inventoryUpdated ? 'atualizado' : 'não atualizado'}. Financeiro ${result.financialUpdated ? 'atualizado' : 'não atualizado'}`);
      
      // Atualizar o documento na lista
      const updatedDocs = documents.map(doc => 
        doc.id === docId ? { ...doc, status: 'imported', updatedInventory: result.inventoryUpdated, updatedFinancial: result.financialUpdated } : doc
      );
      setDocuments(updatedDocs);
      setFilteredDocuments(updatedDocs);
      
      // Se tiver um documento selecionado, atualizá-lo também
      if (selectedDocument && selectedDocument.id === docId) {
        setSelectedDocument({ ...selectedDocument, status: 'imported', updatedInventory: result.inventoryUpdated, updatedFinancial: result.financialUpdated });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir importação');
    } finally {
      setIsLoading(false);
    }
  };

  // Validar mapeamentos de produtos
  const handleValidateItemMappings = async (docId: string, mappings: Array<{itemId: string, productId: string}>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await documentImportService.validateItemMappings(docId, mappings);
      setSuccess(result.message);
      
      // Recarregar lista de documentos
      await fetchDocuments();
      
      // Recarregar documento selecionado se necessário
      if (selectedDocument && selectedDocument.id === docId) {
        const docs = await documentImportService.getImportedDocuments({ search: selectedDocument.documentNumber });
        if (docs.length > 0) {
          setSelectedDocument(docs[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar mapeamentos de produtos');
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-gray-100 text-gray-800">Pendente</span>;
      case 'processing':
        return <span className="badge bg-blue-100 text-blue-800">Processando</span>;
      case 'validated':
        return <span className="badge bg-yellow-100 text-yellow-800">Validado</span>;
      case 'imported':
        return <span className="badge bg-green-100 text-green-800">Importado</span>;
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
            <h1 className="text-2xl font-bold text-gray-900">Importação de Documentos Fiscais</h1>
            <p className="text-gray-500">Importe XMLs de NFe/NFCe e atualize seu estoque automaticamente</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <label className="btn-outline cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Importar XML
            <input 
              type="file" 
              className="hidden" 
              accept=".xml" 
              multiple
              onChange={handleFileUpload}
              disabled={uploadingFiles}
            />
          </label>
          <button 
            className="btn-outline"
            onClick={() => setShowModal(true)}
          >
            <Link className="h-4 w-4 mr-2" />
            Importar por URL
          </button>
          <button 
            className="btn-primary"
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
            placeholder="Buscar por número do documento ou emissor..."
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
            <option value="pending">Pendente</option>
            <option value="processing">Processando</option>
            <option value="validated">Validado</option>
            <option value="imported">Importado</option>
            <option value="error">Erro</option>
          </select>
          <button className="btn-outline py-2">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </button>
          <button 
            className="btn-outline py-2"
            onClick={() => {
              setStatusFilter(null);
              setSearchQuery('');
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </button>
        </div>
      </div>

      {/* Documentos e detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de documentos */}
        <div className="lg:col-span-1 border rounded-lg bg-white overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Documentos Importados</h2>
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
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.documentType.toUpperCase()} {doc.documentNumber}</h3>
                        <p className="text-sm text-gray-600">{doc.issuerName}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(doc.documentDate)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {renderStatusBadge(doc.status)}
                        <span className="mt-1 text-sm font-medium">
                          {formatCurrency(doc.totalValue)}
                        </span>
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
                    <FileText className="h-5 w-5 text-primary mr-2" />
                    {selectedDocument.documentType.toUpperCase()} {selectedDocument.documentNumber}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {renderStatusBadge(selectedDocument.status)}
                    {selectedDocument.documentKey && (
                      <button className="ml-2 bg-gray-100 hover:bg-gray-200 p-1 rounded-md" title="Copiar chave de acesso">
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Informações do documento */}
              <div className="p-6">
                {/* Dados do emissor e documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Dados do Emissor</h3>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium">{selectedDocument.issuerName}</h4>
                      <p className="text-sm text-gray-600 mt-1">CNPJ: {selectedDocument.issuerDocument}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Dados do Documento</h3>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Tipo:</p>
                          <p className="font-medium">{selectedDocument.documentType.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Número:</p>
                          <p className="font-medium">{selectedDocument.documentNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Data:</p>
                          <p className="font-medium">{formatDate(selectedDocument.documentDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor:</p>
                          <p className="font-medium">{formatCurrency(selectedDocument.totalValue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Itens do documento */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Itens do Documento</h3>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDocument.items && selectedDocument.items.length > 0 ? (
                          selectedDocument.items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div>
                                  <p className="font-medium text-gray-900">{item.productDescription}</p>
                                  <p className="text-xs text-gray-500">Cód: {item.productCode}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                {formatCurrency(item.unitValue)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap">
                                {formatCurrency(item.totalValue)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {item.status === 'matched' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Produto encontrado
                                  </span>
                                ) : item.status === 'pending' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Aguardando correspondência
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Erro
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                              Nenhum item encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Ações de acordo com o status */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Importado em: {formatDate(selectedDocument.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    {selectedDocument.status === 'validated' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleCompleteImport(selectedDocument.id)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir Importação
                      </button>
                    )}
                    
                    {selectedDocument.status === 'imported' && (
                      <div className="bg-green-50 px-4 py-2 rounded-lg text-green-700 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <div>
                          <p>Importação concluída</p>
                          {selectedDocument.updatedInventory && (
                            <p className="text-xs">Estoque atualizado</p>
                          )}
                          {selectedDocument.updatedFinancial && (
                            <p className="text-xs">Financeiro atualizado</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedDocument.status === 'error' && selectedDocument.errorDetails && (
                      <div className="bg-red-50 px-4 py-2 rounded-lg text-red-700 text-sm flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Erro na importação:</p>
                          <p>{selectedDocument.errorDetails}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <FileText className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum documento selecionado</h3>
              <p className="text-center max-w-md">
                Selecione um documento na lista ao lado para ver seus detalhes ou importe um novo documento usando os botões acima.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de importação por URL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Importar por URL</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do arquivo XML
                </label>
                <input
                  type="url"
                  className="input w-full"
                  placeholder="https://example.com/document.xml"
                  value={urlToImport}
                  onChange={(e) => setUrlToImport(e.target.value)}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md mb-6">
                <div className="flex">
                  <Info className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <p className="text-sm text-blue-700">
                    Informe a URL completa de um arquivo XML de documento fiscal (NFe, NFCe).
                    O arquivo deve estar acessível publicamente.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="btn-outline"
                  onClick={() => setShowModal(false)}
                  disabled={uploadingFiles}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUrlImport}
                  disabled={!urlToImport || uploadingFiles}
                >
                  {uploadingFiles ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4 mr-2" />
                      Importar XML
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentImporter;