import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  X,
  Plus,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Calendar,
  Clock,
  Utensils,
  Tag
} from 'lucide-react';
import QRCode from 'qrcode.react';
import { PaymentMethod, PaymentDetails } from '../../types/pos';

interface PaymentPanelProps {
  total: number;
  paymentMethods: PaymentDetails[];
  onUpdateMethod: (index: number, method: string) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onAddMethod: () => void;
  onRemoveMethod: (index: number) => void;
  onSetCashReceived: (amount: number) => void;
  onCompletePayment: () => Promise<void>;
  canComplete: boolean;
  isLoading: boolean;
  error?: string;
}

const PaymentPanel: React.FC<PaymentPanelProps> = ({
  total,
  paymentMethods,
  onUpdateMethod,
  onUpdateAmount,
  onAddMethod,
  onRemoveMethod,
  onSetCashReceived,
  onCompletePayment,
  canComplete,
  isLoading,
  error
}) => {
  const [showQuickAmounts, setShowQuickAmounts] = useState(true);
  const [calculatorValue, setCalculatorValue] = useState('0');
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Auto-fill payment amount for first method when panel opens
  useEffect(() => {
    if (paymentMethods.length === 1 && paymentMethods[0].amount === 0) {
      onUpdateAmount(0, total);
    }
  }, [total, paymentMethods, onUpdateAmount]);
  
  // Calculate total paid and change
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const hasCashPayment = paymentMethods.some(p => p.method === 'cash');
  const cashPaymentIndex = paymentMethods.findIndex(p => p.method === 'cash');
  
  const cashReceived = cashPaymentIndex >= 0 ? paymentMethods[cashPaymentIndex].received_amount || 0 : 0;
  const hasChange = hasCashPayment && cashReceived > total && cashReceived >= paymentMethods[cashPaymentIndex].amount;
  const changeAmount = hasChange ? cashReceived - total : 0;
  
  // Common cash amounts for quick selection
  const commonAmounts = [5, 10, 20, 50, 100, 200];
  
  // Get payment method icon
  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'credit':
      case 'debit':
        return <CreditCard className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'pix':
        return <QrCode className="h-5 w-5" />;
      case 'voucher_food':
      case 'voucher_meal':
        return <Utensils className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };
  
  // Get payment method label
  const getMethodLabel = (method: PaymentMethod) => {
    const methodLabels: Record<PaymentMethod, string> = {
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      cash: 'Dinheiro',
      pix: 'PIX',
      voucher_food: 'Vale-Alimentação',
      voucher_meal: 'Vale-Refeição',
      store_credit: 'Crédito na Loja',
      transfer: 'Transferência',
      check: 'Cheque',
      other: 'Outro'
    };
    
    return methodLabels[method] || method;
  };
  
  // Calculator functions
  const handleCalcInput = (value: string) => {
    if (calculatorValue === '0' && value !== '.' && value !== '0' && !isNaN(Number(value))) {
      setCalculatorValue(value);
    } else if (value === 'C') {
      setCalculatorValue('0');
    } else if (value === 'CE') {
      setCalculatorValue(prev => prev.slice(0, -1) || '0');
    } else if (value === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(calculatorValue);
        setCalculatorValue(result.toString());
      } catch (error) {
        setCalculatorValue('Erro');
      }
    } else {
      setCalculatorValue(prev => prev + value);
    }
  };
  
  const applyCalculatorValue = () => {
    try {
      const amount = parseFloat(calculatorValue);
      if (!isNaN(amount)) {
        onSetCashReceived(amount);
      }
      setShowCalculator(false);
    } catch (e) {
      console.error('Invalid calculator value:', e);
    }
  };
  
  // Apply quick cash amount
  const applyQuickAmount = (amount: number) => {
    onSetCashReceived(amount);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50 p-4 border-l border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 flex items-center mb-4">
        <DollarSign className="h-5 w-5 mr-2 text-primary" />
        Pagamento
      </h2>
      
      {/* Total to pay */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-5 border border-primary/10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-900 text-lg">Total a pagar</h3>
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
      
      {/* Payment methods */}
      <div className="space-y-4 flex-grow overflow-y-auto">
        {paymentMethods.map((payment, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700 flex items-center">
                {index === 0 ? 'Forma de pagamento principal' : `Pagamento adicional ${index + 1}`}
              </h4>
              {index > 0 && (
                <button 
                  type="button" 
                  onClick={() => onRemoveMethod(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Método
                </label>
                <select
                  value={payment.method}
                  onChange={(e) => onUpdateMethod(index, e.target.value)}
                  className="select w-full"
                >
                  <option value="credit">Cartão de Crédito</option>
                  <option value="debit">Cartão de Débito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="voucher_food">Vale-Alimentação</option>
                  <option value="voucher_meal">Vale-Refeição</option>
                </select>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-700">R$</span>
                  <input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => onUpdateAmount(index, parseFloat(e.target.value) || 0)}
                    className="flex-1 border py-2 px-3 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    autoFocus={index === 0}
                  />
                </div>
              </div>
            </div>
            
            {/* Cash payment specifics */}
            {payment.method === 'cash' && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Valor recebido
                  </label>
                  <div className="flex items-center space-x-1">
                    <button 
                      type="button"
                      onClick={() => setShowQuickAmounts(!showQuickAmounts)}
                      className="text-xs text-primary hover:text-primary-dark"
                    >
                      {showQuickAmounts ? 'Esconder' : 'Mostrar'} valores rápidos
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowCalculator(true)}
                      className="ml-2 p-1 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      <Calculator className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center mb-2">
                  <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-700">R$</span>
                  <input
                    type="number"
                    value={payment.received_amount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      onSetCashReceived(value);
                    }}
                    className="flex-1 border py-2 px-3 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {/* Quick amount buttons */}
                {showQuickAmounts && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {/* Highlight exact change amount */}
                    <button 
                      type="button"
                      className="px-2 py-1.5 text-sm border rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                      onClick={() => applyQuickAmount(total)}
                    >
                      {formatCurrency(total)}
                    </button>
                    
                    {/* Common amounts */}
                    {commonAmounts
                      .filter(amount => amount >= payment.amount)
                      .slice(0, 5)
                      .map(amount => (
                        <button 
                          type="button"
                          key={amount}
                          className="px-2 py-1.5 text-sm border rounded hover:bg-gray-100 transition-colors"
                          onClick={() => applyQuickAmount(amount)}
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {/* PIX payment specifics */}
            {payment.method === 'pix' && (
              <div className="mt-3 bg-gray-50 p-3 rounded-lg flex flex-col items-center">
                <div className="mb-2 text-sm text-gray-600 text-center">
                  Escaneie o código QR para pagar com PIX
                </div>
                
                <div className="bg-white p-2 rounded-lg">
                  <QRCode 
                    value={`pix-payment-example:${Date.now()}`}
                    size={120}
                    level="H"
                  />
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Chave PIX: exemplo@empresa.com.br
                </div>
              </div>
            )}
            
            {/* Credit card payment specifics */}
            {payment.method === 'credit' && (
              <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parcelas</label>
                  <select className="select w-full text-sm">
                    <option value="1">1x sem juros</option>
                    <option value="2">2x sem juros</option>
                    <option value="3">3x sem juros</option>
                    <option value="4">4x com juros</option>
                    <option value="5">5x com juros</option>
                    <option value="6">6x com juros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bandeira</label>
                  <select className="select w-full text-sm">
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">American Express</option>
                    <option value="other">Outra</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Food/meal voucher specifics */}
            {(payment.method === 'voucher_food' || payment.method === 'voucher_meal') && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Tag className="h-4 w-4 mr-1" />
                    <span>
                      {payment.method === 'voucher_food' ? 'Vale-Alimentação' : 'Vale-Refeição'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Validade: 30 dias</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Prazo: 30 dias</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add additional payment method */}
        {paymentMethods.length < 3 && (
          <button
            type="button"
            className="w-full flex items-center justify-center p-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            onClick={onAddMethod}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar outra forma de pagamento
          </button>
        )}
      </div>
      
      {/* Payment summary */}
      <div className="mt-4 pt-4 border-t">
        {/* Error message */}
        {error && (
          <div className="mb-3 bg-red-50 p-3 rounded-lg text-red-800 text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Valor total:</span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Valor pago:</span>
          <span className={`font-medium ${totalPaid < total ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(totalPaid)}
          </span>
        </div>
        
        {totalPaid < total && (
          <div className="flex justify-between mb-2 text-red-600">
            <span>Faltam:</span>
            <span className="font-medium">{formatCurrency(total - totalPaid)}</span>
          </div>
        )}
        
        {hasChange && (
          <div className="flex justify-between text-green-700 text-lg font-bold mb-2">
            <span>Troco:</span>
            <span>{formatCurrency(changeAmount)}</span>
          </div>
        )}
        
        <button
          type="button"
          className="btn-primary w-full py-3 mt-3"
          disabled={!canComplete || isLoading}
          onClick={onCompletePayment}
        >
          {isLoading ? (
            <>
              <span className="loader mr-2"></span>
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Venda
            </>
          )}
        </button>
      </div>
      
      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Calculadora</h3>
              <button 
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-4 text-right text-2xl font-medium h-16 flex items-center justify-end overflow-x-auto">
                {calculatorValue}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {/* First row */}
                <button onClick={() => handleCalcInput('7')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">7</button>
                <button onClick={() => handleCalcInput('8')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">8</button>
                <button onClick={() => handleCalcInput('9')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">9</button>
                <button onClick={() => handleCalcInput('/')} className="bg-gray-100 border rounded-lg p-3 text-lg hover:bg-gray-200">/</button>
                
                {/* Second row */}
                <button onClick={() => handleCalcInput('4')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">4</button>
                <button onClick={() => handleCalcInput('5')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">5</button>
                <button onClick={() => handleCalcInput('6')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">6</button>
                <button onClick={() => handleCalcInput('*')} className="bg-gray-100 border rounded-lg p-3 text-lg hover:bg-gray-200">×</button>
                
                {/* Third row */}
                <button onClick={() => handleCalcInput('1')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">1</button>
                <button onClick={() => handleCalcInput('2')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">2</button>
                <button onClick={() => handleCalcInput('3')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">3</button>
                <button onClick={() => handleCalcInput('-')} className="bg-gray-100 border rounded-lg p-3 text-lg hover:bg-gray-200">-</button>
                
                {/* Fourth row */}
                <button onClick={() => handleCalcInput('0')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50 col-span-2">0</button>
                <button onClick={() => handleCalcInput('.')} className="bg-white border rounded-lg p-3 text-lg hover:bg-gray-50">.</button>
                <button onClick={() => handleCalcInput('+')} className="bg-gray-100 border rounded-lg p-3 text-lg hover:bg-gray-200">+</button>
                
                {/* Fifth row */}
                <button onClick={() => handleCalcInput('C')} className="bg-red-100 border rounded-lg p-3 text-lg text-red-700 hover:bg-red-200">C</button>
                <button onClick={() => handleCalcInput('CE')} className="bg-yellow-100 border rounded-lg p-3 text-sm text-yellow-800 hover:bg-yellow-200">←</button>
                <button onClick={() => handleCalcInput('=')} className="bg-primary border rounded-lg p-3 text-lg text-white hover:bg-primary-dark col-span-2">=</button>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button 
                className="btn-primary w-full"
                onClick={applyCalculatorValue}
              >
                Usar Valor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPanel;