import React, { useState } from 'react';
import { QrCode, CreditCard, Banknote, ArrowRightCircle } from 'lucide-react';
import { PaymentMethodType } from '../../types/payment';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethodType) => void;
  amount: number;
  disabled?: boolean;
}

/**
 * Componente para seleção do método de pagamento
 */
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelect,
  amount,
  disabled = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);

  const handleSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    onSelect(method);
  };

  // Formatar valor monetário
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Escolha o Método de Pagamento</h2>
        <p className="text-gray-600 mt-2">
          Valor a pagar: <span className="font-semibold">{formatCurrency(amount)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Opção PIX */}
        <button
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            !disabled && selectedMethod === 'pix' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }`}
          onClick={() => !disabled && handleSelect('pix')}
          disabled={disabled}
        >
          <QrCode className={`h-12 w-12 mx-auto mb-4 ${
            !disabled && selectedMethod === 'pix' 
              ? 'text-primary' 
              : 'text-gray-700'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            !disabled && selectedMethod === 'pix' 
              ? 'text-primary' 
              : 'text-gray-900'
          }`}>PIX</h3>
          <p className="text-sm text-gray-500">
            Pague instantaneamente utilizando QR Code
          </p>
          {!disabled && selectedMethod === 'pix' && (
            <ArrowRightCircle className="h-6 w-6 text-primary mx-auto mt-4" />
          )}
        </button>

        {/* Opção Cartão */}
        <button
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            !disabled && (selectedMethod === 'credit' || selectedMethod === 'debit')
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }`}
          onClick={() => !disabled && handleSelect('credit')}
          disabled={disabled}
        >
          <CreditCard className={`h-12 w-12 mx-auto mb-4 ${
            !disabled && (selectedMethod === 'credit' || selectedMethod === 'debit')
              ? 'text-primary' 
              : 'text-gray-700'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            !disabled && (selectedMethod === 'credit' || selectedMethod === 'debit')
              ? 'text-primary' 
              : 'text-gray-900'
          }`}>Cartão</h3>
          <p className="text-sm text-gray-500">
            Débito ou crédito em até 12x
          </p>
          {!disabled && (selectedMethod === 'credit' || selectedMethod === 'debit') && (
            <ArrowRightCircle className="h-6 w-6 text-primary mx-auto mt-4" />
          )}
        </button>

        {/* Opção Dinheiro */}
        <button
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            !disabled && selectedMethod === 'cash' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }`}
          onClick={() => !disabled && handleSelect('cash')}
          disabled={disabled}
        >
          <Banknote className={`h-12 w-12 mx-auto mb-4 ${
            !disabled && selectedMethod === 'cash' 
              ? 'text-primary' 
              : 'text-gray-700'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            !disabled && selectedMethod === 'cash' 
              ? 'text-primary' 
              : 'text-gray-900'
          }`}>Dinheiro</h3>
          <p className="text-sm text-gray-500">
            Pague em espécie e receba o troco
          </p>
          {!disabled && selectedMethod === 'cash' && (
            <ArrowRightCircle className="h-6 w-6 text-primary mx-auto mt-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;