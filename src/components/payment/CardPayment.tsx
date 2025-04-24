import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  ChevronsUp, 
  ChevronsDown, 
  Lock, 
  Shield, 
  Wifi 
} from 'lucide-react';
import { CardPaymentInput, CardTransactionInfo } from '../../types/payment';
import { paymentService } from '../../services/paymentService';

interface CardPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  reference?: string;
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
  allowInstallments?: boolean;
  maxInstallments?: number;
}

/**
 * Componente para pagamento via cartão de crédito/débito
 */
const CardPayment: React.FC<CardPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  reference,
  customerName,
  customerEmail,
  customerDocument,
  allowInstallments = true,
  maxInstallments = 12
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<CardTransactionInfo | null>(null);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit'>('credit');
  const [installments, setInstallments] = useState<number>(1);
  const [showingInstallments, setShowingInstallments] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [terminalMessage, setTerminalMessage] = useState<string>('');

  // Referência para simular o terminal TEF
  const terminalRef = useRef<HTMLDivElement>(null);

  // Calcular parcelas com juros
  const calculateInstallments = () => {
    const installmentValues: { value: number; amount: number; total: number }[] = [];
    const maxInstallmentsWithoutInterest = Math.min(6, maxInstallments);

    for (let i = 1; i <= maxInstallments; i++) {
      let installmentValue = amount / i;
      let totalAmount = amount;

      // Adicionar juros nas parcelas após a sexta
      if (i > maxInstallmentsWithoutInterest) {
        const interestRate = 0.0199; // 1,99% ao mês
        totalAmount = amount * Math.pow(1 + interestRate, i - maxInstallmentsWithoutInterest);
        installmentValue = totalAmount / i;
      }

      installmentValues.push({
        value: i,
        amount: installmentValue,
        total: totalAmount
      });
    }

    return installmentValues;
  };

  // Lista de instalments calculados
  const installmentOptions = calculateInstallments();

  // Função para processar o pagamento
  const processPayment = async () => {
    setIsLoading(true);
    setStatus('processing');
    setError(null);
    setTerminalMessage('Iniciando comunicação com o terminal...');

    try {
      // Simular interação com terminal TEF
      await simulateTerminalInteraction();

      // Chamar o serviço de pagamento
      const paymentInput: CardPaymentInput = {
        amount,
        type: paymentType,
        installments,
        description: `Pagamento ${reference || ''}`.trim(),
        reference,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument
        }
      };

      const response = await paymentService.processCardPayment(paymentInput);

      if (response.success && response.transaction) {
        if (response.transaction.cardInfo) {
          setTransaction(response.transaction.cardInfo);
        }
        setTransactionId(response.transaction.id);
        setStatus('success');
        setTerminalMessage('Pagamento aprovado!');
        
        // Simular finalização do pagamento com sucesso após um pequeno delay
        setTimeout(() => {
          onPaymentSuccess(response.transaction!.id);
        }, 1500);
      } else {
        throw new Error(response.error?.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      setStatus('error');
      setTerminalMessage('Erro na comunicação com o terminal');
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento com cartão');
      onPaymentError(error instanceof Error ? error.message : 'Erro ao processar pagamento com cartão');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para simular interação com terminal TEF
  const simulateTerminalInteraction = async () => {
    const messages = [
      'Conectando com o terminal...',
      'Terminal conectado! Insira ou aproxime o cartão...',
      'Lendo informações do cartão...',
      paymentType === 'debit' ? 'Digite sua senha no terminal...' : 'Processando...',
      'Conectando com a operadora...',
      'Verificando dados...',
      'Autorizando transação...',
      'Finalizando transação...'
    ];

    for (const message of messages) {
      setTerminalMessage(message);
      // Esperar um tempo entre cada mensagem (entre 1 e 2,5 segundos)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Exibir terminal com animação de digitação
  useEffect(() => {
    if (terminalRef.current && terminalMessage) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalMessage]);

  // Componente para o terminal TEF
  const renderTerminal = () => (
    <div 
      className="mt-6 border-2 border-gray-300 rounded-lg p-3 bg-black text-green-400 font-mono text-sm h-40 overflow-y-auto"
      ref={terminalRef}
    >
      <div className="mb-2 flex justify-between items-center">
        <span className="text-xs text-gray-400">Terminal TEF v2.1</span>
        <div className="flex items-center">
          <Wifi className="h-3 w-3 text-green-500 mr-1" />
          <span className="text-xs text-green-500">Conectado</span>
        </div>
      </div>
      <div className="border-b border-gray-700 mb-2"></div>
      <div>
        <div>$ Terminal de pagamento</div>
        <div>$ {formatCurrency(amount)}</div>
        <div>$ {paymentType === 'credit' ? 'Crédito' : 'Débito'}</div>
        {paymentType === 'credit' && installments > 1 && (
          <div>$ {installments}x de {formatCurrency(installmentOptions.find(opt => opt.value === installments)?.amount || amount / installments)}</div>
        )}
        <div className="mt-2">$ {terminalMessage}
          <span className="animate-pulse">_</span>
        </div>
        {status === 'success' && (
          <div className="text-green-400 mt-2">Transação aprovada!</div>
        )}
        {status === 'error' && (
          <div className="text-red-500 mt-2">Falha na transação. Tente novamente.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <CreditCard className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Pagamento com Cartão</h2>
        </div>
        <p className="text-gray-600">
          Valor a pagar: {formatCurrency(amount)}
        </p>
      </div>

      {/* Tipo de cartão */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cartão</label>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`py-3 px-4 rounded-lg border-2 flex items-center justify-center ${
              paymentType === 'credit' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setPaymentType('credit')}
            disabled={isLoading}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Crédito
          </button>
          <button 
            className={`py-3 px-4 rounded-lg border-2 flex items-center justify-center ${
              paymentType === 'debit' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setPaymentType('debit')}
            disabled={isLoading}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Débito
          </button>
        </div>
      </div>

      {/* Parcelas (apenas para crédito) */}
      {paymentType === 'credit' && allowInstallments && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Parcelas</label>
            <button 
              className="text-primary text-sm flex items-center"
              onClick={() => setShowingInstallments(!showingInstallments)}
              disabled={isLoading}
            >
              {showingInstallments ? (
                <>
                  <ChevronsUp className="h-4 w-4 mr-1" />
                  Esconder opções
                </>
              ) : (
                <>
                  <ChevronsDown className="h-4 w-4 mr-1" />
                  Ver opções
                </>
              )}
            </button>
          </div>

          <div className="mt-2">
            <button
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-md shadow-sm text-left flex justify-between items-center"
              onClick={() => setShowingInstallments(!showingInstallments)}
              disabled={isLoading}
            >
              <span>
                {installments}x {installments === 1 ? 'à vista' : ''}
                {installments > 1 && installments <= 6 ? ' sem juros' : ''}
                {installments > 6 ? ' com juros' : ''}
              </span>
              <span className="font-medium">
                {formatCurrency(installmentOptions.find(opt => opt.value === installments)?.amount || amount / installments)}
              </span>
            </button>
          </div>

          {/* Dropdown de parcelas */}
          {showingInstallments && (
            <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-white max-h-60 overflow-y-auto">
              {installmentOptions.map((option, index) => (
                <button
                  key={index}
                  className={`w-full py-2 px-3 text-left hover:bg-gray-50 flex justify-between items-center ${
                    index !== installmentOptions.length - 1 ? 'border-b border-gray-100' : ''
                  } ${installments === option.value ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    setInstallments(option.value);
                    setShowingInstallments(false);
                  }}
                  disabled={isLoading}
                >
                  <span>
                    {option.value}x {option.value === 1 ? 'à vista' : ''}
                    {option.value > 1 && option.value <= 6 ? ' sem juros' : ''}
                    {option.value > 6 ? ' com juros' : ''}
                  </span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(option.amount)}</div>
                    {option.value > 6 && (
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency(option.total)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bandeiras de cartão */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Bandeiras Aceitas</label>
        <div className="flex space-x-2 border border-gray-200 rounded-md p-3 bg-gray-50">
          {['visa', 'mastercard', 'elo', 'amex', 'hipercard'].map(brand => (
            <div key={brand} className="flex items-center justify-center">
              <img 
                src={`https://cdn.jsdelivr.net/gh/maticpokorn/payment-icons@master/assets/card/${brand}.svg`} 
                alt={brand} 
                className="h-8" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Terminal visual */}
      {renderTerminal()}

      {/* Mensagem de erro */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 rounded-md text-sm text-red-700 border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Botão de processamento */}
      <div className="mt-6">
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
              <CreditCard className="h-5 w-5 mr-2" />
              {paymentType === 'credit' ? 'Pagar com Crédito' : 'Pagar com Débito'}
            </>
          )}
        </button>
      </div>

      {/* Informações de segurança */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center mb-1">
          <Lock className="h-3 w-3 mr-1" />
          <Shield className="h-3 w-3 mr-1" />
          <span>Pagamento Seguro</span>
        </div>
        <p>
          Seus dados são criptografados e protegidos em conformidade com o PCI DSS
        </p>
      </div>
    </div>
  );
};

export default CardPayment;