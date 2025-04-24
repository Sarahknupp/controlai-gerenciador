import React, { useState, useCallback } from 'react';
import { FileText, CheckCircle, AlertTriangle, XCircle, Loader } from 'lucide-react';
import { fiscalService } from '../services/fiscalService';
import { FiscalDocumentType, Sale, SaleItem } from '../types/pos';
import { toast } from 'react-toastify';

interface FiscalDocumentButtonProps {
  sale?: Sale;
  items?: SaleItem[];
  documentType?: FiscalDocumentType;
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'outline';
  className?: string;
}

/**
 * Botão para emissão de documentos fiscais (NFC-e e NF-e)
 * 
 * Integra com o fiscalService para emissão de documentos
 * fiscais eletrônicos conforme a legislação brasileira
 */
const FiscalDocumentButton: React.FC<FiscalDocumentButtonProps> = ({
  sale,
  items,
  documentType = 'nfce',
  onSuccess,
  onError,
  variant = 'primary',
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Determina estilo do botão com base no variant
  const buttonStyle = variant === 'primary'
    ? 'btn-primary'
    : 'btn-outline border-gray-300 hover:bg-gray-50';

  // Emite o documento fiscal
  const emitDocument = useCallback(async () => {
    if (!sale || !items || items.length === 0 || isProcessing) {
      if (!sale) {
        setStatusMessage('Venda não encontrada');
        setCurrentStatus('error');
        if (onError) onError('Venda não encontrada');
        return;
      }
      if (!items || items.length === 0) {
        setStatusMessage('Venda sem itens');
        setCurrentStatus('error');
        if (onError) onError('Venda sem itens');
        return;
      }
      return;
    }

    setIsProcessing(true);
    setCurrentStatus('processing');
    setStatusMessage('Processando documento fiscal...');

    try {
      // Log para auditoria
      console.log(`[${new Date().toISOString()}] Iniciando emissão de ${documentType} para venda ${sale.id}`);

      // Validação de dados essenciais
      validateSaleData(sale, items);

      // Emissão do documento fiscal
      const document = await fiscalService.issueFiscalDocument(sale, items, documentType);
      
      // Feedback positivo
      setCurrentStatus('success');
      setStatusMessage(document.status === 'issued' 
        ? `${getDocumentTypeLabel(documentType)} emitida com sucesso!` 
        : `${getDocumentTypeLabel(documentType)} em processamento`);
      
      // Callback de sucesso
      if (onSuccess) onSuccess(document.id);
      
      // Notificação toast
      toast.success(`${getDocumentTypeLabel(documentType)} ${document.document_number} emitida com sucesso!`);

      // Log para auditoria
      console.log(`[${new Date().toISOString()}] ${documentType} emitida com sucesso: ${document.id}`);
      
      return document;
    } catch (error) {
      console.error('Erro ao emitir documento fiscal:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Falha na emissão do documento fiscal';
      
      setCurrentStatus('error');
      setStatusMessage(errorMessage);
      
      // Callback de erro
      if (onError) onError(errorMessage);
      
      // Notificação toast
      toast.error(`Erro ao emitir ${getDocumentTypeLabel(documentType)}: ${errorMessage}`);
      
      // Log para auditoria
      console.error(`[${new Date().toISOString()}] Erro ao emitir ${documentType}: ${errorMessage}`);
      
      return null;
    } finally {
      // Reset após 5 segundos
      setTimeout(() => {
        setIsProcessing(false);
        // Apenas limpa o status se for sucesso ou erro, não se ainda estiver processando
        if (currentStatus !== 'processing') {
          setCurrentStatus('idle');
          setStatusMessage('');
        }
      }, 5000);
    }
  }, [sale, items, documentType, isProcessing, onSuccess, onError]);

  // Função auxiliar para validar dados da venda
  const validateSaleData = (sale: Sale, items: SaleItem[]) => {
    // Validação de campos essenciais
    if (!sale.total || sale.total <= 0) {
      throw new Error('Valor total da venda inválido');
    }
    
    if (items.length === 0) {
      throw new Error('Venda sem itens');
    }
    
    // Validar dados fiscais dos produtos
    for (const item of items) {
      if (!item.product_sku || !item.product_name) {
        throw new Error(`Item ${item.id} com dados incompletos`);
      }
      
      if (item.quantity <= 0) {
        throw new Error(`Quantidade inválida para o item ${item.product_name}`);
      }
      
      if (item.unit_price <= 0) {
        throw new Error(`Preço inválido para o item ${item.product_name}`);
      }
    }
    
    // Se tiver cliente, validar CPF/CNPJ quando presente
    if (sale.customer && sale.customer.document) {
      const document = sale.customer.document.replace(/[^0-9]/g, '');
      
      // Validação básica de CPF (11 dígitos) ou CNPJ (14 dígitos)
      if (document.length !== 11 && document.length !== 14) {
        throw new Error('CPF/CNPJ do cliente inválido');
      }
    }
  };

  // Função auxiliar para obter o label do tipo de documento
  const getDocumentTypeLabel = (type: FiscalDocumentType): string => {
    switch (type) {
      case 'nfce': return 'NFC-e';
      case 'nfe': return 'NF-e';
      case 'sat': return 'CF-e SAT';
      case 'cfe': return 'CF-e';
      default: return 'Nota Fiscal';
    }
  };

  // Renderiza o ícone com base no status
  const renderStatusIcon = () => {
    switch (currentStatus) {
      case 'processing':
        return <Loader className="h-4 w-4 mr-2 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 mr-2 text-white" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  // Classes condicionais com base no status
  const getButtonClasses = () => {
    const baseClasses = `${buttonStyle} py-2 px-4 flex items-center justify-center rounded-lg transition-colors ${className}`;
    
    if (currentStatus === 'processing') {
      return `${baseClasses} opacity-90 cursor-not-allowed`;
    }
    
    if (currentStatus === 'success') {
      return `${baseClasses} bg-green-600 hover:bg-green-700 border-green-600 text-white`;
    }
    
    if (currentStatus === 'error') {
      return `${baseClasses} bg-red-600 hover:bg-red-700 border-red-600 text-white`;
    }
    
    return baseClasses;
  };

  return (
    <div>
      <button 
        type="button"
        className={getButtonClasses()}
        onClick={emitDocument}
        disabled={isProcessing || !sale || !items || items.length === 0}
        title={`Emitir ${getDocumentTypeLabel(documentType)}`}
      >
        {renderStatusIcon()}
        <span>
          {currentStatus === 'idle' && `Emitir ${getDocumentTypeLabel(documentType)}`}
          {currentStatus === 'processing' && statusMessage}
          {currentStatus === 'success' && (statusMessage || `${getDocumentTypeLabel(documentType)} emitida!`)}
          {currentStatus === 'error' && 'Erro na emissão'}
        </span>
      </button>
      
      {/* Mensagem de erro detalhada abaixo do botão */}
      {currentStatus === 'error' && statusMessage && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
            <span className="text-sm text-red-600">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalDocumentButton;