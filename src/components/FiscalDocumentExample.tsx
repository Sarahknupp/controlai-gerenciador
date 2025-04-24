import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Download, Mail, Printer, RefreshCw } from 'lucide-react';
import FiscalDocumentButton from './FiscalDocumentButton';
import FiscalDocumentModal from './FiscalDocumentModal';
import FiscalDocumentWidget from './FiscalDocumentWidget';
import { FiscalDocument } from '../types/pos';

/**
 * Componente de exemplo para demonstrar a integração fiscal
 */
const FiscalDocumentExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [emittedDocument, setEmittedDocument] = useState<FiscalDocument | null>(null);
  const [documentType, setDocumentType] = useState<'nfce' | 'nfe'>('nfce');

  // Dados de exemplo
  const sampleSale = {
    id: 'sample-sale-123',
    operator_id: 'user-123',
    terminal_id: 'terminal-1',
    cashier_session_id: 'session-123',
    subtotal: 150.0,
    discount_amount: 0,
    tax_amount: 15.0,
    total: 150.0,
    status: 'completed',
    payment_details: [
      { method: 'credit', amount: 150.0 }
    ],
    created_at: new Date().toISOString(),
    customer: {
      name: 'Cliente Exemplo',
      document: '123.456.789-00'
    }
  } as any;

  const sampleItems = [
    {
      id: 'item-1',
      sale_id: 'sample-sale-123',
      product_id: 'prod-1',
      product_sku: 'PROD001',
      product_name: 'Produto de Teste 1',
      quantity: 2,
      unit_price: 50.0,
      discount: 0,
      total: 100.0,
      tax_rate: 10.0,
      tax_amount: 10.0
    },
    {
      id: 'item-2',
      sale_id: 'sample-sale-123',
      product_id: 'prod-2',
      product_sku: 'PROD002',
      product_name: 'Produto de Teste 2',
      quantity: 1,
      unit_price: 50.0,
      discount: 0,
      total: 50.0,
      tax_rate: 10.0,
      tax_amount: 5.0
    }
  ];

  const handleDocumentSuccess = (document: FiscalDocument) => {
    setEmittedDocument(document);
  };

  const openModal = (type: 'nfce' | 'nfe') => {
    setDocumentType(type);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-900">
        Demonstração de Integração Fiscal
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Botões de emissão */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">
            Emissão de Documentos
          </h3>
          
          <p className="text-sm text-gray-600 mb-3">
            Clique em um dos botões abaixo para emitir um documento fiscal para a venda de exemplo:
          </p>
          
          <FiscalDocumentButton 
            sale={sampleSale}
            items={sampleItems}
            documentType="nfce"
            onSuccess={handleDocumentSuccess}
            className="w-full justify-center"
          />
          
          <FiscalDocumentButton 
            sale={sampleSale}
            items={sampleItems}
            documentType="nfe"
            onSuccess={handleDocumentSuccess}
            variant="outline"
            className="w-full justify-center"
          />
          
          <div className="pt-4">
            <button
              type="button"
              className="text-primary hover:text-primary-dark text-sm w-full text-center"
              onClick={() => openModal('nfce')}
            >
              Ver modal completo de emissão
            </button>
          </div>
        </div>
        
        {/* Coluna 2: Documento emitido */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">
            Documento Emitido
          </h3>
          
          {emittedDocument ? (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">
                    {emittedDocument.document_type === 'nfce' ? 'NFC-e' : 'NF-e'} 
                    {emittedDocument.document_number ? ` ${emittedDocument.document_number}` : ''}
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Emitido
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                Emitido em: {new Date(emittedDocument.issue_date).toLocaleString('pt-BR')}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimir
                </button>
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Email
                </button>
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  XML
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-4 flex flex-col items-center justify-center h-40">
              <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Nenhum documento emitido
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 p-3 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Ambiente de demonstração</p>
                <p className="mt-1">
                  As emissões nesta página são simuladas para fins de demonstração.
                  Em ambiente de produção, os documentos seriam emitidos através da
                  SEFAZ e outros órgãos regulatórios.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coluna 3: Widget de status */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">
            Status do Serviço
          </h3>
          
          <FiscalDocumentWidget />
          
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-start">
              <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700">
                <p className="mt-1">
                  Este widget monitora a disponibilidade do serviço fiscal e permite
                  sincronizar documentos emitidos em modo de contingência quando a
                  conexão é restaurada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal completo */}
      {showModal && (
        <FiscalDocumentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          sale={sampleSale}
          items={sampleItems}
          documentType={documentType}
          onSuccess={handleDocumentSuccess}
        />
      )}
    </div>
  );
};

export default FiscalDocumentExample;