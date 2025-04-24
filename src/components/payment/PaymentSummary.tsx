import React from 'react';
import { 
  Check, 
  AlertTriangle, 
  DollarSign, 
  ClipboardList, 
  Clock, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Utensils
} from 'lucide-react';
import { PaymentTransaction } from '../../types/payment';

interface PaymentSummaryProps {
  transactions: PaymentTransaction[];
  totalAmount: number;
}

/**
 * Componente que exibe um resumo dos pagamentos realizados
 */
const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  transactions,
  totalAmount
}) => {
  // Calculate totals
  const paidAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const isFullyPaid = remainingAmount === 0;
  
  // Group payments by method
  const paymentsByMethod: Record<string, number> = {};
  transactions.forEach(t => {
    if (paymentsByMethod[t.type]) {
      paymentsByMethod[t.type] += t.amount;
    } else {
      paymentsByMethod[t.type] = t.amount;
    }
  });

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Render payment method icon
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return <QrCode className="h-4 w-4 text-primary" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'voucher':
        return <Utensils className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get method name for display
  const getMethodName = (method: string): string => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'credit':
        return 'Cartão de Crédito';
      case 'debit':
        return 'Cartão de Débito';
      case 'cash':
        return 'Dinheiro';
      case 'voucher':
        return 'Vale-Refeição/Alimentação';
      default:
        return method;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-primary" />
          Resumo do Pagamento
        </h3>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isFullyPaid 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isFullyPaid ? (
            <div className="flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Pago
            </div>
          ) : (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Pagamento Parcial
            </div>
          )}
        </div>
      </div>
      
      {/* Payment totals */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-gray-600">Valor Total:</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-gray-600">Valor Pago:</span>
          <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
        </div>
        {!isFullyPaid && (
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-gray-800">Valor Restante:</span>
            <span className="text-red-600">{formatCurrency(remainingAmount)}</span>
          </div>
        )}
      </div>
      
      {/* Payment method breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhamento:</h4>
        <div className="space-y-1">
          {Object.entries(paymentsByMethod).map(([method, amount], index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                {getMethodIcon(method)}
                <span className="ml-2">{getMethodName(method)}</span>
              </div>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Transaction details */}
      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Transações:</h4>
          <div className="space-y-2">
            {transactions.map((transaction, index) => (
              <div 
                key={index} 
                className="text-xs p-2 rounded-md bg-gray-50 border border-gray-100"
              >
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono">{transaction.id.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Data/Hora:</span>
                  <span>{new Date(transaction.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Status:</span>
                  <span className={`${
                    transaction.status === 'approved' ? 'text-green-600' : 
                    transaction.status === 'pending' ? 'text-yellow-600' : 
                    'text-gray-600'
                  }`}>
                    {transaction.status === 'approved' ? 'Aprovado' : 
                     transaction.status === 'pending' ? 'Pendente' : 
                     transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notice for multiple payments */}
      {transactions.length > 1 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
            <p>
              Esta venda foi realizada com pagamento dividido em {transactions.length} métodos diferentes.
              Um comprovante será gerado para cada forma de pagamento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;