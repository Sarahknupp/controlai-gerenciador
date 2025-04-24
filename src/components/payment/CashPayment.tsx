import React, { useState, useEffect } from 'react';
import { Banknote, Calculator, Check, DollarSign, AlertTriangle } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { CashTransactionInfo } from '../../types/payment';

interface CashPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string, changeAmount?: number) => void;
  onPaymentError: (error: string) => void;
  reference?: string;
}

/**
 * Componente para pagamento em dinheiro com cálculo de troco
 */
const CashPayment: React.FC<CashPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  reference
}) => {
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [calculatorVisible, setCalculatorVisible] = useState<boolean>(false);
  const [calculatorValue, setCalculatorValue] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionInfo, setTransactionInfo] = useState<CashTransactionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([]);

  // Calcular valores rápidos com base no valor a ser pago
  useEffect(() => {
    const baseValues = [5, 10, 20, 50, 100, 200];
    const filteredValues = baseValues.filter(value => value > amount * 0.5);
    
    // Se o valor é pequeno, adicione valores menores
    if (amount < 10) {
      filteredValues.unshift(amount); // Adiciona valor exato
    } 
    // Sempre adiciona o valor exato como primeiro item se não for muito pequeno
    else if (!baseValues.includes(amount)) {
      const roundedAmount = Math.ceil(amount / 5) * 5; // Arredonda para o múltiplo de 5 mais próximo
      filteredValues.unshift(roundedAmount);
    }

    setQuickAmounts(filteredValues);
  }, [amount]);

  // Calcular o troco quando o valor pago é alterado
  useEffect(() => {
    const paid = parseFloat(paidAmount) || 0;
    const change = Math.max(0, paid - amount);
    setChangeAmount(change);
  }, [paidAmount, amount]);

  // Atualizar valor pago com base na calculadora
  const updateFromCalculator = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(calculatorValue);
      setPaidAmount(result.toString());
      setCalculatorVisible(false);
    } catch (error) {
      console.error('Erro ao calcular:', error);
      setError('Cálculo inválido');
    }
  };

  // Registrar pagamento em dinheiro
  const processPayment = async () => {
    const paid = parseFloat(paidAmount) || 0;
    
    if (paid < amount) {
      setError('O valor pago deve ser maior ou igual ao valor da compra');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await paymentService.processCashPayment({
        amount,
        amountPaid: paid,
        description: `Pagamento em dinheiro${reference ? ` (${reference})` : ''}`,
        reference
      });

      if (response.success && response.transaction) {
        if (response.transaction.cashInfo) {
          setTransactionInfo(response.transaction.cashInfo);
          onPaymentSuccess(response.transaction.id, response.transaction.cashInfo.changeAmount);
        } else {
          throw new Error('Informações do pagamento não encontradas');
        }
      } else {
        throw new Error(response.error?.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento em dinheiro:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      onPaymentError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para lidar com entrada na calculadora
  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      // Clear
      setCalculatorValue('0');
    } else if (value === '<=') {
      // Backspace
      setCalculatorValue(prev => 
        prev.length > 1 ? prev.slice(0, -1) : '0'
      );
    } else if (value === '=') {
      // Calculate
      try {
        // eslint-disable-next-line no-eval
        const result = eval(calculatorValue);
        setCalculatorValue(result.toString());
      } catch (error) {
        setCalculatorValue('Erro');
        setTimeout(() => setCalculatorValue('0'), 1000);
      }
    } else {
      // Add digit or operator
      setCalculatorValue(prev => {
        if (prev === '0' && !isNaN(Number(value))) {
          return value;
        } else {
          return prev + value;
        }
      });
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar calculadora
  const renderCalculator = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xs w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Calculadora</h3>
          <button 
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setCalculatorVisible(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Display da calculadora */}
        <div className="bg-gray-100 p-4">
          <div className="text-right text-3xl font-mono h-12 flex justify-end items-center">
            {calculatorValue}
          </div>
        </div>

        {/* Botões da calculadora */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {/* Linha 1 */}
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300" 
              onClick={() => handleCalculatorInput('7')}
            >7</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('8')}
            >8</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('9')}
            >9</button>
            <button 
              className="bg-primary text-white h-12 rounded-lg hover:bg-primary-dark"
              onClick={() => handleCalculatorInput('/')}
            >÷</button>

            {/* Linha 2 */}
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('4')}
            >4</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('5')}
            >5</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('6')}
            >6</button>
            <button 
              className="bg-primary text-white h-12 rounded-lg hover:bg-primary-dark"
              onClick={() => handleCalculatorInput('*')}
            >×</button>

            {/* Linha 3 */}
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('1')}
            >1</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('2')}
            >2</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('3')}
            >3</button>
            <button 
              className="bg-primary text-white h-12 rounded-lg hover:bg-primary-dark"
              onClick={() => handleCalculatorInput('-')}
            >-</button>

            {/* Linha 4 */}
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('0')}
            >0</button>
            <button 
              className="bg-gray-200 h-12 rounded-lg hover:bg-gray-300"
              onClick={() => handleCalculatorInput('.')}
            >.</button>
            <button 
              className="bg-red-500 text-white h-12 rounded-lg hover:bg-red-600"
              onClick={() => handleCalculatorInput('C')}
            >C</button>
            <button 
              className="bg-primary text-white h-12 rounded-lg hover:bg-primary-dark"
              onClick={() => handleCalculatorInput('+')}
            >+</button>

            {/* Backspace e igual */}
            <button 
              className="bg-yellow-500 text-white h-12 rounded-lg hover:bg-yellow-600 col-span-2"
              onClick={() => handleCalculatorInput('<=')}
            >Apagar</button>
            <button 
              className="bg-green-500 text-white h-12 rounded-lg hover:bg-green-600 col-span-2"
              onClick={() => handleCalculatorInput('=')}
            >=</button>
          </div>

          <button
            className="mt-4 w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
            onClick={updateFromCalculator}
          >
            Utilizar Valor
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Banknote className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Pagamento em Dinheiro</h2>
        </div>
        <p className="text-gray-600">
          Valor a pagar: {formatCurrency(amount)}
        </p>
      </div>

      {/* Entrada de valor pago */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valor Recebido
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={paidAmount}
            onChange={(e) => {
              // Permitir apenas números e um ponto decimal
              const value = e.target.value.replace(/[^\d.]/g, '');
              // Impedir múltiplos pontos decimais
              const parts = value.split('.');
              if (parts.length > 2) {
                return;
              }
              setPaidAmount(value);
            }}
            className="input pl-10 text-lg font-medium"
            placeholder="0.00"
            disabled={isProcessing}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setCalculatorVisible(true)}
            disabled={isProcessing}
          >
            <Calculator className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>

      {/* Valores rápidos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valores Rápidos
        </label>
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((value, index) => (
            <button
              key={index}
              className="py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setPaidAmount(value.toString())}
              disabled={isProcessing}
            >
              {formatCurrency(value)}
            </button>
          ))}
        </div>
      </div>

      {/* Exibição do troco */}
      <div 
        className={`mb-6 p-4 rounded-lg ${
          changeAmount > 0
            ? 'bg-green-50 border border-green-100'
            : parseFloat(paidAmount) > 0 && parseFloat(paidAmount) < amount
              ? 'bg-red-50 border border-red-100'
              : 'bg-gray-50 border border-gray-100'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Valor a Pagar:</span>
          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-medium text-gray-700">Valor Recebido:</span>
          <span className="text-sm font-medium">{formatCurrency(parseFloat(paidAmount) || 0)}</span>
        </div>
        <div className="border-t mt-2 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Troco:</span>
            <span className={`font-bold ${
              changeAmount > 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {formatCurrency(changeAmount)}
            </span>
          </div>
        </div>
        
        {parseFloat(paidAmount) > 0 && parseFloat(paidAmount) < amount && (
          <div className="mt-2 text-sm text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Valor recebido menor que o valor a pagar.
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 rounded-md text-sm text-red-700 border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Botão de finalizar */}
      <button
        className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
          isProcessing 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : transactionInfo
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : (parseFloat(paidAmount) || 0) >= amount
                ? 'bg-primary hover:bg-primary-dark text-white'
                : 'bg-gray-300 text-white cursor-not-allowed'
        }`}
        onClick={processPayment}
        disabled={isProcessing || (parseFloat(paidAmount) || 0) < amount || !!transactionInfo}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processando...
          </>
        ) : transactionInfo ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Pagamento Concluído!
          </>
        ) : (
          <>
            <Banknote className="h-5 w-5 mr-2" />
            Finalizar Pagamento
          </>
        )}
      </button>
      
      {/* Calculadora */}
      {calculatorVisible && renderCalculator()}
    </div>
  );
};

export default CashPayment;