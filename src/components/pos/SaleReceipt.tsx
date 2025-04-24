import React, { forwardRef } from 'react';
import { Sale, SaleItem, PaymentDetails } from '../../types/pos';

interface SaleReceiptProps {
  sale?: Sale;
  items?: SaleItem[];
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
  companyPhone?: string;
  logoUrl?: string;
}

const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(({ 
  sale, 
  items,
  companyName = 'Casa dos Pães',
  companyDocument = '12.345.678/0001-90',
  companyAddress = 'Rua Exemplo, 123 - Centro',
  companyPhone = '(11) 99999-8888',
  logoUrl
}, ref) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'voucher_food': 'Vale-Alimentação',
      'voucher_meal': 'Vale-Refeição',
      'store_credit': 'Crédito na Loja',
      'transfer': 'Transferência',
      'check': 'Cheque',
      'other': 'Outro'
    };
    
    return methodMap[method] || method;
  };
  
  // Calculate total paid and change
  const totalPaid = sale?.payment_details?.reduce((sum, pd) => sum + pd.amount, 0) || 0;
  const cashPayment = sale?.payment_details?.find(pd => pd.method === 'cash');
  const hasChange = cashPayment && cashPayment.received_amount && cashPayment.received_amount > cashPayment.amount;
  
  return (
    <div ref={ref} className="p-4" style={{ width: '80mm', fontFamily: 'Arial' }}>
      <div className="text-center mb-4">
        {logoUrl && (
          <div className="mb-2">
            <img src={logoUrl} alt={companyName} className="h-16 mx-auto" />
          </div>
        )}
        <h1 className="text-xl font-bold">{companyName}</h1>
        <p className="text-sm">CNPJ: {companyDocument}</p>
        <p className="text-sm">{companyAddress}</p>
        <p className="text-sm">{companyPhone}</p>
      </div>
      
      <div className="border-t border-b py-2 my-2 text-center">
        <p className="font-bold">CUPOM NÃO FISCAL</p>
        <p className="text-sm">
          {sale?.created_at 
            ? new Date(sale.created_at).toLocaleString('pt-BR')
            : new Date().toLocaleString('pt-BR')
          }
        </p>
        {sale?.id && (
          <p className="text-sm font-medium">Código: #{sale.id}</p>
        )}
        {sale?.customer?.name && (
          <div className="mt-1 text-sm">
            <p>Cliente: {sale.customer.name}</p>
            {sale.customer.document && (
              <p>Documento: {sale.customer.document}</p>
            )}
          </div>
        )}
      </div>
      
      <table className="w-full text-sm my-2">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">ITEM</th>
            <th className="text-right">QTD</th>
            <th className="text-right">VALOR</th>
            <th className="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, index) => (
            <tr key={`receipt-${index}`} className="border-b">
              <td className="text-left py-1">{item.product_name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.unit_price)}</td>
              <td className="text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="border-t pt-2">
        <div className="flex justify-between py-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale?.subtotal || 0)}</span>
        </div>
        {(sale?.discount_amount || 0) > 0 && (
          <div className="flex justify-between py-1">
            <span>Desconto:</span>
            <span>-{formatCurrency(sale?.discount_amount || 0)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale?.total || 0)}</span>
        </div>
      </div>
      
      <div className="border-t pt-2 mt-2">
        <p className="font-bold text-center">FORMA DE PAGAMENTO</p>
        {sale?.payment_details?.map((payment, idx) => (
          <div className="flex justify-between py-1" key={idx}>
            <span>{getPaymentMethodLabel(payment.method)}:</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
        ))}
        
        {hasChange && cashPayment && (
          <div className="pt-2">
            <div className="flex justify-between py-1">
              <span>Valor Recebido:</span>
              <span>{formatCurrency(cashPayment.received_amount || 0)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span>TROCO:</span>
              <span>{formatCurrency(cashPayment.received_amount 
                ? cashPayment.received_amount - (sale?.total || 0)
                : 0)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {sale?.fiscal_document_number && (
        <div className="border-t pt-2 mt-2 text-sm">
          <p className="font-medium">DADOS FISCAIS</p>
          <p>Número NFC-e: {sale.fiscal_document_number}</p>
          {sale.fiscal_document_status === 'issued' ? (
            <p>Status: AUTORIZADO</p>
          ) : (
            <p>Status: PENDENTE - Consulte o documento fiscal no portal</p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <p className="font-medium mb-1">OBRIGADO PELA PREFERÊNCIA!</p>
        <p className="text-xs">Volte sempre!</p>
        <p className="text-xs mt-2">{new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
});

export default SaleReceipt;