import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { PaymentTransaction } from '../../types/payment';

interface VoucherPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  reference?: string;
  customerName?: string;
  customerDocument?: string;
}

/**
 * Componente para pagamento com vale-refeição/alimentação
 */
const VoucherPayment: React.FC<VoucherPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  reference,
  customerName,
  customerDocument
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voucherType, setVoucherType] = useState<'meal' | 'food'>('meal');
  const [cardNumber, setCardNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Process payment
  const processPayment = async () => {
    // If card number is provided, validate it
    if (cardNumber && cardNumber.length < 16) {
      setError('Número de cartão inválido. Deve conter pelo menos 16 dígitos');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('processing');
    setTerminalMessages([
      'Iniciando processamento do vale...',
      'Conectando com terminal...'
    ]);

    try {
      // Simulate terminal processing with messages
      await simulateTerminalProcessing();
      
      // Generate a transaction ID
      const transactionId = `VOUCHER-${Date.now()}`;
      
      // Create a synthetic transaction
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: 'voucher',
        status: 'approved',
        amount,
        currency: 'BRL',
        description: `Pagamento via vale ${voucherType === 'meal' ? 'refeição' : 'alimentação'}`,
        reference,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        customer: {
          name: customerName,
          document: customerDocument
        },
        processorResponse: {
          code: '00',
          message: 'Aprovado',
          processorName: 'VR/Sodexo/Alelo'
        }
      };

      // Store transaction (in a real system, this would be in a database)
      localStorage.setItem(`transaction_${transactionId}`, JSON.stringify(transaction));
      
      setStatus('success');
      setTerminalMessages(prev => [...prev, 'Transação aprovada!']);
      
      // Wait a moment before calling success callback
      setTimeout(() => {
        onPaymentSuccess(transactionId);
      }, 1500);
    } catch (error) {
      console.error('Error processing voucher payment:', error);
      setStatus('error');
      setTerminalMessages(prev => [...prev, 'Erro na transação!']);
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      onPaymentError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate the terminal processing messages
  const simulateTerminalProcessing = async () => {
    const messages = [
      'Terminal conectado',
      'Aproxime ou insira o cartão...',
      'Lendo cartão...',
      'Verificando saldo...',
      'Autorizando transação...',
      'Processando...'
    ];

    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      setTerminalMessages(prev => [...prev, message]);
    }

    // 10% chance of failure for testing
    if (Math.random() < 0.1) {
      throw new Error('Transação recusada pela operadora');
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted.substring(0, 19)); // Limit to 16 digits + 3 spaces
  };

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Utensils className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-bold text-gray-900">
            {voucherType === 'meal' ? 'Vale-Refeição' : 'Vale-Alimentação'}
          </h2>
        </div>
        <p className="text-gray-600">
          Valor a pagar: {formatCurrency(amount)}
        </p>
      </div>

      {/* Voucher type selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Vale
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`py-3 px-4 rounded-lg border-2 flex items-center justify-center ${
              voucherType === 'meal' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setVoucherType('meal')}
            disabled={isLoading}
          >
            <Utensils className="h-5 w-5 mr-2" />
            Refeição
          </button>
          <button 
            className={`py-3 px-4 rounded-lg border-2 flex items-center justify-center ${
              voucherType === 'food' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setVoucherType('food')}
            disabled={isLoading}
          >
            <Utensils className="h-5 w-5 mr-2" />
            Alimentação
          </button>
        </div>
      </div>

      {/* Card information entry */}
      {status === 'idle' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número do Cartão (Opcional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Digite o número do cartão ou apenas aproxime/insira o cartão no terminal.
          </p>
        </div>
      )}

      {/* Terminal simulation display */}
      <div className="mb-6 border-2 border-gray-300 rounded-lg p-3 bg-black text-green-400 font-mono text-sm h-40 overflow-y-auto">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-xs text-gray-400">Terminal de Pagamento</span>
          <span className={`text-xs ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-500' : 'text-yellow-500'}`}>
            {status === 'idle' ? 'Aguardando' : 
             status === 'processing' ? 'Processando' : 
             status === 'success' ? 'Aprovado' : 'Erro'}
          </span>
        </div>
        <div className="border-b border-gray-700 mb-2"></div>
        
        {terminalMessages.length === 0 ? (
          <div>
            <div className="text-gray-500">Aguardando iniciar transação...</div>
            <div className="mt-2">{formatCurrency(amount)}</div>
            <div className="mt-1">{voucherType === 'meal' ? 'Vale-Refeição' : 'Vale-Alimentação'}</div>
          </div>
        ) : (
          <div>
            {terminalMessages.map((msg, index) => (
              <div key={index} className="mb-1">
                {msg}
              </div>
            ))}
            <span className="animate-pulse">_</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Process payment button */}
      <button
        className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
          isLoading 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : status === 'success'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : status === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary-dark text-white'
        }`}
        onClick={processPayment}
        disabled={isLoading || status === 'success'}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processando...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Pagamento Aprovado!
          </>
        ) : status === 'error' ? (
          <>
            <AlertTriangle className="h-5 w-5 mr-2" />
            Tentar Novamente
          </>
        ) : (
          <>
            <Utensils className="h-5 w-5 mr-2" />
            Processar Pagamento
          </>
        )}
      </button>

      {/* Info text */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          Os cartões de vale-refeição e vale-alimentação possuem finalidades específicas
          determinadas pelo Programa de Alimentação do Trabalhador (PAT).
        </p>
      </div>
    </div>
  );
};

export default VoucherPayment;