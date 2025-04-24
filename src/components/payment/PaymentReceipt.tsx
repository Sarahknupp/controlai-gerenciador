import React, { forwardRef } from 'react';
import { PaymentTransaction, CashTransactionInfo, CardTransactionInfo, PixTransactionInfo } from '../../types/payment';

interface PaymentReceiptProps {
  transaction?: PaymentTransaction;
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
  companyPhone?: string;
  logoUrl?: string;
  orderReference?: string;
  orderItems?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

/**
 * Componente para geração de comprovante de pagamento
 */
const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(({ 
  transaction, 
  companyName = 'Controlaí Comércio',
  companyDocument = '12.345.678/0001-90',
  companyAddress = 'Rua Exemplo, 123 - Centro',
  companyPhone = '(11) 99999-8888',
  logoUrl = '',
  orderReference = '',
  orderItems = []
}, ref) => {
  // Caso não tenha transação, não renderiza nada
  if (!transaction) return null;

  // Formata moeda para exibição
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Obtém nome do método de pagamento
  const getPaymentMethodName = (type: string): string => {
    const methods: Record<string, string> = {
      'pix': 'PIX',
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'transfer': 'Transferência',
      'voucher': 'Vale'
    };
    
    return methods[type] || type;
  };

  // Formata data
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Obtém detalhes específicos do método de pagamento
  const renderPaymentDetails = () => {
    if (transaction.type === 'credit' || transaction.type === 'debit') {
      const cardInfo = transaction.cardInfo as CardTransactionInfo;
      if (!cardInfo) return null;
      
      return (
        <div className="mt-3">
          <p className="font-mono text-sm">CARTAO {transaction.type === 'credit' ? 'CREDITO' : 'DEBITO'}</p>
          {cardInfo.brand && <p className="font-mono text-sm">BANDEIRA: {cardInfo.brand.toUpperCase()}</p>}
          {cardInfo.lastDigits && <p className="font-mono text-sm">FINAL: {cardInfo.lastDigits}</p>}
          {cardInfo.authorizationCode && <p className="font-mono text-sm">AUTORIZACAO: {cardInfo.authorizationCode}</p>}
          {transaction.type === 'credit' && cardInfo.installments && cardInfo.installments > 1 && (
            <p className="font-mono text-sm">PARCELAMENTO: {cardInfo.installments}x</p>
          )}
        </div>
      );
    }
    
    if (transaction.type === 'cash') {
      const cashInfo = transaction.cashInfo as CashTransactionInfo;
      if (!cashInfo) return null;
      
      return (
        <div className="mt-3">
          <div className="flex justify-between font-mono text-sm">
            <span>VALOR RECEBIDO:</span>
            <span>{formatCurrency(cashInfo.amountPaid)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span>TROCO:</span>
            <span>{formatCurrency(cashInfo.changeAmount)}</span>
          </div>
        </div>
      );
    }
    
    if (transaction.type === 'pix') {
      const pixInfo = transaction.pixInfo as PixTransactionInfo;
      if (!pixInfo) return null;
      
      return (
        <div className="mt-3">
          <p className="font-mono text-sm">PAGAMENTO VIA PIX</p>
          <p className="font-mono text-sm">ID: {pixInfo.transactionId}</p>
          {transaction.completedAt && (
            <p className="font-mono text-sm">CONFIRMACAO: {formatDate(transaction.completedAt)}</p>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div ref={ref} className="bg-white p-6 max-w-sm mx-auto font-mono text-sm" style={{ width: '80mm' }}>
      {/* Cabeçalho */}
      <div className="text-center mb-4">
        {logoUrl && (
          <img src={logoUrl} alt={companyName} className="h-12 mx-auto mb-3" />
        )}
        <h1 className="font-bold">{companyName}</h1>
        <p className="text-xs">{companyDocument}</p>
        <p className="text-xs">{companyAddress}</p>
        <p className="text-xs mb-2">{companyPhone}</p>
        <div className="border-t border-b border-black py-1 my-1">
          <p className="font-bold">COMPROVANTE DE PAGAMENTO</p>
          <p>Não é documento fiscal</p>
        </div>
      </div>

      {/* Dados da transação */}
      <div className="mb-3">
        <p><strong>DATA/HORA:</strong> {formatDate(transaction.createdAt)}</p>
        {orderReference && <p><strong>PEDIDO:</strong> {orderReference}</p>}
        <p><strong>TRANSAÇÃO:</strong> {transaction.id}</p>
      </div>

      {/* Itens do pedido, se fornecidos */}
      {orderItems && orderItems.length > 0 && (
        <div className="mb-3 border-t border-b border-dashed border-gray-300 py-2">
          <p className="font-bold mb-1">ITENS</p>
          {orderItems.map((item, index) => (
            <div key={index} className="text-xs mb-1">
              <div className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
              <div className="text-right text-xs text-gray-600">
                {item.quantity > 1 && (
                  `${formatCurrency(item.unitPrice)} un.`
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Valores */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold">{formatCurrency(transaction.amount)}</span>
        </div>
      </div>

      {/* Dados do método de pagamento */}
      <div className="border-t border-b py-2 mb-3">
        <p className="font-bold">FORMA DE PAGAMENTO</p>
        <p>{getPaymentMethodName(transaction.type)}</p>
        {renderPaymentDetails()}
        <div className="mt-2">
          <p className="text-center font-bold">
            {transaction.status === 'approved' && 'PAGAMENTO APROVADO'}
            {transaction.status === 'pending' && 'PAGAMENTO PENDENTE'}
            {transaction.status === 'denied' && 'PAGAMENTO NEGADO'}
            {transaction.status === 'cancelled' && 'PAGAMENTO CANCELADO'}
          </p>
        </div>
      </div>

      {/* Cliente, se disponível */}
      {transaction.customer && (
        <div className="mb-3">
          <p className="font-bold">CLIENTE</p>
          {transaction.customer.name && <p>{transaction.customer.name}</p>}
          {transaction.customer.document && <p>CPF/CNPJ: {transaction.customer.document}</p>}
        </div>
      )}

      {/* Rodapé */}
      <div className="text-center mt-4">
        <p>OBRIGADO PELA PREFERÊNCIA!</p>
        <p className="text-xs mt-2">Documento gerado em {formatDate(new Date())}</p>
      </div>
    </div>
  );
});

PaymentReceipt.displayName = 'PaymentReceipt';

export default PaymentReceipt;