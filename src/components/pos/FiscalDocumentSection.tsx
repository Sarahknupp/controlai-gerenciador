import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Printer, Mail, Download, RefreshCw } from 'lucide-react';
import { FiscalDocument, Sale, SaleItem } from '../../types/pos';
import FiscalDocumentButton from '../FiscalDocumentButton';
import FiscalDocumentModal from '../FiscalDocumentModal';

interface FiscalDocumentSectionProps {
  sale?: Sale;
  items?: SaleItem[];
  onDocumentUpdate?: (document: FiscalDocument) => void;
}

/**
 * Seção para exibição e gerenciamento de documentos fiscais
 * relacionados a uma venda
 */
const FiscalDocumentSection: React.FC<FiscalDocumentSectionProps> = ({
  sale,
  items,
  onDocumentUpdate
}) => {
  const [showModal, setShowModal] = useState(false);
  const [existingDocument, setExistingDocument] = useState<FiscalDocument | null>(null);
  const [documentType, setDocumentType] = useState<'nfce' | 'nfe'>('nfce');

  // Verificar se já existe um documento fiscal para esta venda
  useEffect(() => {
    if (!sale) return;
    
    if (sale.fiscal_document_id && sale.fiscal_document_status) {
      // Em uma aplicação real, buscaríamos o documento completo
      // Aqui vamos simular um documento com os dados disponíveis
      setExistingDocument({
        id: sale.fiscal_document_id,
        sale_id: sale.id,
        document_type: 'nfce',
        document_number: sale.fiscal_document_number || '',
        status: sale.fiscal_document_status === 'issued' ? 'issued' : 'pending',
        issue_date: sale.created_at,
        contingency_mode: false,
        created_at: sale.created_at,
        updated_at: sale.created_at
      });
    } else {
      setExistingDocument(null);
    }
  }, [sale]);

  // Função para abrir o modal com o documento correto
  const openDocumentModal = (type: 'nfce' | 'nfe') => {
    setDocumentType(type);
    setShowModal(true);
  };

  // Função para lidar com o sucesso da emissão
  const handleDocumentSuccess = (document: FiscalDocument) => {
    setExistingDocument(document);
    if (onDocumentUpdate) {
      onDocumentUpdate(document);
    }
  };

  // Obter cor do status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter label do status
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'issued':
        return 'Autorizado';
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status || 'Desconhecido';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-primary" />
        Documentos Fiscais
      </h3>

      {existingDocument ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <span className="font-medium mr-2">
                  {existingDocument.document_type === 'nfce' ? 'NFC-e' : 'NF-e'}:
                </span>
                <span className="text-gray-700">
                  {existingDocument.document_number}
                </span>
              </div>
              
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(existingDocument.status)}`}>
                  {existingDocument.status === 'issued' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {existingDocument.status === 'rejected' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {getStatusLabel(existingDocument.status)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(existingDocument.issue_date).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Imprimir Documento"
                onClick={() => setShowModal(true)}
              >
                <Printer className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Enviar por E-mail"
                onClick={() => setShowModal(true)}
              >
                <Mail className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Baixar XML"
                onClick={() => setShowModal(true)}
              >
                <Download className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Atualizar Status"
                onClick={() => setShowModal(true)}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            className="btn-outline w-full text-sm py-2"
            onClick={() => setShowModal(true)}
          >
            Ver Detalhes do Documento
          </button>
          
          {/* Exibir opção para emitir NF-e se o documento atual for NFC-e */}
          {existingDocument.document_type === 'nfce' && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Também é possível emitir uma NF-e para esta venda:
              </p>
              <FiscalDocumentButton 
                sale={sale}
                items={items}
                documentType="nfe"
                onSuccess={handleDocumentSuccess}
                variant="outline"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ainda não foi emitido um documento fiscal para esta venda.
            Escolha um tipo de documento para emitir:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FiscalDocumentButton
              sale={sale}
              items={items}
              documentType="nfce"
              onSuccess={handleDocumentSuccess}
              variant="primary"
            />
            
            <FiscalDocumentButton
              sale={sale}
              items={items}
              documentType="nfe"
              onSuccess={handleDocumentSuccess}
              variant="outline"
            />
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md mt-4">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700">
                <span className="font-medium block">Importante:</span>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>NFC-e é utilizada para consumidor final</li>
                  <li>NF-e é utilizada para empresas ou quando o cliente solicitar</li>
                  <li>É necessário CPF/CNPJ do cliente para emissão de NF-e</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para emissão/visualização de documento fiscal */}
      {showModal && (
        <FiscalDocumentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          sale={sale}
          items={items}
          documentType={documentType}
          existingDocumentId={existingDocument?.id}
          onSuccess={handleDocumentSuccess}
        />
      )}
    </div>
  );
};

export default FiscalDocumentSection;