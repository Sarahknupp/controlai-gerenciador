import React, { useState, useEffect } from 'react';
import { DollarSign, Trash, AlertTriangle, QrCode, CreditCard, Banknote, Utensils, Plus } from 'lucide-react';
import { PaymentMethodType, PaymentTransaction } from '../../types/payment';

interface SplitPaymentProps {
  totalAmount: number;
  onPaymentAdd: (method: PaymentMethodType, amount: number) => void;
  onPaymentRemove: (index: number) => void;
  payments: {
    method: PaymentMethodType;
    amount: number;
    transaction?: PaymentTransaction;
  }[];
}

/**
 * Componente para gerenciar pagamentos divididos (split)
 */
const SplitPayment: React.FC<SplitPaymentProps> = ({
  totalAmount,
  onPaymentAdd,
  onPaymentRemove,
  payments
}) => {
  const [newMethod, setNewMethod] = useState<PaymentMethodType>('credit');
  const [newAmount, setNewAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);

  // Calculate remaining amount when payments change
  useEffect(() => {
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    setRemainingAmount(Math.max(0, totalAmount - paidAmount));
    
    // If this is a new payment and nothing has been paid yet, pre-fill with total amount
    if (payments.length === 0 && newAmount === '') {
      setNewAmount(totalAmount.toFixed(2));
    } else if (payments.length > 0 && remainingAmount > 0 && newAmount === '') {
      setNewAmount(remainingAmount.toFixed(2));
    }
  }, [payments, totalAmount, remainingAmount]);

  // Handle adding a new payment
  const handleAddPayment = () => {
    const amount = parseFloat(newAmount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setError('Valor inválido');
      return;
    }
    
    // Validate against remaining
    if (amount > remainingAmount) {
      setError(`O valor não pode exceder o valor restante (${formatCurrency(remainingAmount)})`);
      return;
    }
    
    // Add payment
    onPaymentAdd(newMethod, amount);
    
    // Reset form
    setNewAmount('');
    setError(null);
  };

  // Get payment method icon
  const getMethodIcon = (method: PaymentMethodType) => {
    switch (method) {
      case 'pix':
        return <QrCode className="h-5 w-5 text-primary" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'cash':
        return <Banknote className="h-5 w-5 text-green-600" />;
      case 'voucher':
        return <Utensils className="h-5 w-5 text-purple-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get payment method name
  const getMethodName = (method: PaymentMethodType) => {
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="font-semibold text-lg mb-4 flex items-center">
        <DollarSign className="h-5 w-5 mr-2 text-primary" />
        Pagamento Dividido
      </h3>

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pagamentos Adicionados:</h4>
          <div className="space-y-2">
            {payments.map((payment, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg flex justify-between items-center ${
                  payment.transaction ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  {getMethodIcon(payment.method)}
                  <span className="ml-2">{getMethodName(payment.method)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-3">{formatCurrency(payment.amount)}</span>
                  {!payment.transaction && (
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onPaymentRemove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-3 border-t pt-3 flex justify-between font-medium">
              <span>Valor Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Valor Pago:</span>
              <span>{formatCurrency(totalAmount - remainingAmount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Valor Restante:</span>
              <span className={remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add new payment section */}
      {remainingAmount > 0 && (
        <div className="p-4 rounded-lg bg-gray-50 border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar Pagamento:</h4>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select
              className="input w-full"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value as PaymentMethodType)}
            >
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
              <option value="voucher">Vale-Refeição/Alimentação</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input pl-10"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="btn-outline flex-1 py-2 text-sm"
              onClick={() => setNewAmount(remainingAmount.toFixed(2))}
            >
              Valor Restante
            </button>
            <button 
              className="btn-primary flex-1 py-2 text-sm flex items-center justify-center"
              onClick={handleAddPayment}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Payment complete message */}
      {remainingAmount === 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center text-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium">Pagamento Completo!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Todos os valores foram pagos. Você pode prosseguir para finalizar a venda.
          </p>
        </div>
      )}
    </div>
  );
};

export default SplitPayment;