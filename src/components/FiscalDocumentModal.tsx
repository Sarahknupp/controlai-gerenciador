import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Mail, 
  Copy, 
  CheckCircle,
  X, 
  AlertTriangle, 
  Info,
  Loader
} from 'lucide-react';
import { fiscalService } from '../services/fiscalService';
import { FiscalDocument, FiscalDocumentType, Sale, SaleItem } from '../types/pos';

interface FiscalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale;
  items?: SaleItem[];
  documentType?: FiscalDocumentType;
  existingDocumentId?: string;
  onSuccess?: (document: FiscalDocument) => void;
}

/**
 * Modal para emissão e visualização de documentos fiscais
 */
const FiscalDocumentModal: React.FC<FiscalDocumentModalProps> = ({
  isOpen,
  onClose,
  sale,
  items,
  documentType = 'nfce',
  existingDocumentId,
  onSuccess
}) => {
  // Estados do componente
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<FiscalDocument | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Buscar documento existente ou criar um novo
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (existingDocumentId) {
          // Buscar documento existente
          const { data, error } = await fiscalService.getDocument(existingDocumentId);
          
          if (error) throw new Error(error.message);
          
          setDocument(data);
          
          // Verificar status se ainda estiver em processamento
          if (data.status === 'processing' || data.status === 'pending') {
            checkDocumentStatus(data.id);
          }
        }
      } catch (err) {
        console.error("Error fetching fiscal document:", err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar documento fiscal');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
  }, [isOpen, existingDocumentId]);

  // Verificar status do documento periodicamente
  const checkDocumentStatus = async (documentId: string) => {
    setIsProcessing(true);
    
    try {
      const status = await fiscalService.checkDocumentStatus(documentId);
      
      if (status === 'processing' || status === 'pending') {
        // Se ainda estiver processando, verificar novamente em 3 segundos
        setTimeout(() => checkDocumentStatus(documentId), 3000);
      } else {
        // Buscar documento completo se não estiver mais processando
        const { data, error } = await fiscalService.getDocument(documentId);
        
        if (error) throw new Error(error.message);
        
        setDocument(data);
        setIsProcessing(false);
        
        // Chamar callback de sucesso se o documento foi emitido
        if (data.status === 'issued' && onSuccess) {
          onSuccess(data);
        }
      }
    } catch (err) {
      console.error("Error checking document status:", err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar status do documento');
      setIsProcessing(false);
    }
  };

  // Emitir documento fiscal
  const issueDocument = async () => {
    if (!sale || !items || items.length === 0) {
      setError('Dados da venda incompletos');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Emitir documento através do fiscalService
      const fiscalDocument = await fiscalService.issueFiscalDocument(
        sale, 
        items, 
        documentType
      );
      
      setDocument(fiscalDocument);
      
      // Se o documento estiver em processamento, verificar status periodicamente
      if (fiscalDocument.status === 'processing' || fiscalDocument.status === 'pending') {
        checkDocumentStatus(fiscalDocument.id);
      } else if (fiscalDocument.status === 'issued' && onSuccess) {
        // Chamar callback de sucesso se o documento foi emitido imediatamente
        onSuccess(fiscalDocument);
      }
    } catch (err) {
      console.error("Error issuing fiscal document:", err);
      setError(err instanceof Error ? err.message : 'Erro ao emitir documento fiscal');
    } finally {
      setIsLoading(false);
    }
  };

  // Imprimir documento
  const printDocument = async () => {
    if (!document) return;
    
    try {
      const result = await fiscalService.printDocument(document.id);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Fechar modal após impressão bem-sucedida
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Error printing document:", err);
      setError(err instanceof Error ? err.message : 'Erro ao imprimir documento');
    }
  };

  // Enviar documento por e-mail
  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document || !emailTo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fiscalService.sendDocumentByEmail(document.id, emailTo);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setEmailSent(true);
      setShowEmailForm(false);
      
      // Resetar após 3 segundos
      setTimeout(() => {
        setEmailSent(false);
        setEmailTo('');
      }, 3000);
    } catch (err) {
      console.error("Error sending email:", err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar documento
  const cancelDocument = async () => {
    if (!document) return;
    
    // Confirmar cancelamento
    const reason = prompt('Informe o motivo do cancelamento:');
    
    if (!reason) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fiscalService.cancelDocument(document.id, reason);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Atualizar documento após cancelamento
      const { data, error } = await fiscalService.getDocument(document.id);
      
      if (error) throw new Error(error.message);
      
      setDocument(data);
    } catch (err) {
      console.error("Error cancelling document:", err);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar documento');
    } finally {
      setIsLoading(false);
    }
  };

  // Baixar XML do documento
  const downloadXml = () => {
    if (!document || !document.xml) return;
    
    try {
      // Criar um Blob com o conteúdo XML
      const blob = new Blob(
        [atob(document.xml)], 
        { type: 'application/xml' }
      );
      
      // Criar URL para o Blob
      const url = URL.createObjectURL(blob);
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.document_type}_${document.document_number}.xml`;
      
      // Clicar automaticamente no link
      link.click();
      
      // Liberar URL
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading XML:", err);
      setError("Erro ao baixar XML");
    }
  };

  // Copiar chave de acesso
  const copyAccessKey = () => {
    if (!document || !document.access_key) return;
    
    navigator.clipboard.writeText(document.access_key)
      .then(() => {
        // Feedback visual (poderia ser um toast)
        alert('Chave de acesso copiada!');
      })
      .catch(err => {
        console.error("Error copying access key:", err);
        setError("Erro ao copiar chave de acesso");
      });
  };

  // Função auxiliar para obter o label do tipo de documento
  const getDocumentTypeLabel = (type?: FiscalDocumentType): string => {
    switch (type) {
      case 'nfce': return 'NFC-e';
      case 'nfe': return 'NF-e';
      case 'sat': return 'CF-e SAT';
      case 'cfe': return 'CF-e';
      default: return 'Nota Fiscal';
    }
  };

  // Função auxiliar para obter a cor do status
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'issued': return 'text-green-600 bg-green-100';
      case 'processing':
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Função auxiliar para obter o label do status
  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'issued': return 'Autorizada';
      case 'processing': return 'Processando';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitada';
      case 'cancelled': return 'Cancelada';
      default: return status || 'Desconhecido';
    }
  };

  // Tratar formato de datas
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            {document 
              ? `${getDocumentTypeLabel(document.document_type)} ${document.document_number}`
              : `Emitir ${getDocumentTypeLabel(documentType)}`
            }
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Carregando documento fiscal...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium">Erro</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  
                  <button 
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                    onClick={() => {
                      setError(null);
                      if (!document) {
                        issueDocument();
                      }
                    }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          ) : document ? (
            // Documento existente
            <div className="space-y-6">
              {/* Status e informações principais */}
              <div className="flex justify-between items-start">
                <div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                    {isProcessing ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {document.status === 'issued' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {document.status === 'rejected' && <AlertTriangle className="h-4 w-4 mr-2" />}
                        {document.status === 'cancelled' && <X className="h-4 w-4 mr-2" />}
                        {getStatusLabel(document.status)}
                      </>
                    )}
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Data de Emissão</p>
                      <p className="font-medium">{formatDate(document.issue_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Série</p>
                      <p className="font-medium">{document.series || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Botões de ação */}
                {document.status === 'issued' && (
                  <div className="space-y-2">
                    <button 
                      className="btn-outline text-sm py-1 px-3 w-full flex items-center justify-center"
                      onClick={printDocument}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </button>
                    
                    <button 
                      className="btn-outline text-sm py-1 px-3 w-full flex items-center justify-center"
                      onClick={() => setShowEmailForm(true)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por E-mail
                    </button>
                  </div>
                )}
              </div>
              
              {/* Chave de acesso */}
              {document.access_key && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-700">Chave de Acesso:</p>
                    <button 
                      className="text-primary hover:text-primary-dark text-sm flex items-center"
                      onClick={copyAccessKey}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </button>
                  </div>
                  <p className="text-sm font-mono mt-1 break-all">{document.access_key}</p>
                </div>
              )}
              
              {/* Mensagem de status/erro */}
              {document.status_message && (
                <div className={`p-3 rounded-md ${
                  document.status === 'rejected' 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm">{document.status_message}</p>
                  </div>
                </div>
              )}
              
              {/* Formulário de e-mail */}
              {showEmailForm && (
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Enviar por E-mail</h4>
                  <form onSubmit={sendEmail}>
                    <div className="flex">
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="flex-1 input"
                        placeholder="Digite o e-mail do destinatário"
                        required
                      />
                      <button
                        type="submit"
                        className="btn-primary ml-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Mensagem de e-mail enviado */}
              {emailSent && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <p className="text-sm text-green-700">
                      E-mail enviado com sucesso!
                    </p>
                  </div>
                </div>
              )}
              
              {/* Ações adicionais */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-3">
                    {document.status === 'issued' && (
                      <button
                        className="btn-outline text-sm py-1 px-3 text-red-600 hover:bg-red-50"
                        onClick={cancelDocument}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar Documento
                      </button>
                    )}
                    
                    {document.xml && (
                      <button
                        className="btn-outline text-sm py-1 px-3"
                        onClick={downloadXml}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar XML
                      </button>
                    )}
                  </div>
                  
                  {document.pdf_url && (
                    <a
                      href={document.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm py-1 px-3"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Visualizar PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Emissão de novo documento
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-800 font-medium">Informações</h3>
                    <p className="text-blue-700 mt-1">
                      Você está prestes a emitir {documentType === 'nfce' ? 'uma NFC-e' : 'uma NF-e'} 
                      para esta venda. Este processo comunicará com a SEFAZ e gerará um documento fiscal 
                      eletrônico oficial.
                    </p>
                    
                    {sale && (
                      <div className="mt-3 p-3 bg-white rounded-md">
                        <p className="font-medium">Resumo da Venda</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                          <div>
                            <span className="text-gray-500">Valor Total:</span>
                            <span className="ml-1 font-medium">
                              R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Itens:</span>
                            <span className="ml-1 font-medium">
                              {items?.length || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Cliente:</span>
                            <span className="ml-1 font-medium">
                              {sale.customer?.name || 'Consumidor Final'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Data:</span>
                            <span className="ml-1 font-medium">
                              {formatDate(sale.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn-primary py-2 w-full flex items-center justify-center"
                onClick={issueDocument}
                disabled={isLoading || isProcessing}
              >
                {isLoading || isProcessing ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    <span>Emitir {getDocumentTypeLabel(documentType)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiscalDocumentModal;