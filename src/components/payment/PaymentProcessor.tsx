import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  AlertTriangle, 
  ArrowLeft, 
  Printer, 
  Mail, 
  XCircle, 
  Banknote,
  CreditCard,
  QrCode
} from 'lucide-react';
import { PaymentMethodType, PaymentTransaction } from '../../types/payment';
import PaymentMethodSelector from './PaymentMethodSelector';
import PixPayment from './PixPayment';
import CardPayment from './CardPayment';
import CashPayment from './CashPayment';
import PaymentReceipt from './PaymentReceipt';
import ReactToPrint from 'react-to-print';

interface PaymentProcessorProps {
  amount: number;
  reference?: string;
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
  orderItems?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  onPaymentComplete: (transaction: PaymentTransaction) => void;
  onCancel?: () => void;
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
  companyPhone?: string;
  logoUrl?: string;
}

/**
 * Componente principal que gerencia o fluxo de pagamento
 */
const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  reference,
  customerName,
  customerEmail,
  customerDocument,
  orderItems,
  onPaymentComplete,
  onCancel,
  companyName,
  companyDocument,
  companyAddress,
  companyPhone,
  logoUrl
}) => {
  // Estados do componente
  const [step, setStep] = useState<'method-selection' | 'payment-processing' | 'payment-complete'>('method-selection');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptEmail, setReceiptEmail] = useState(customerEmail || '');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);

  // Referência para o componente de recibo (para impressão)
  const receiptRef = useRef<HTMLDivElement>(null);

  // Voltar para a seleção de método de pagamento
  const goBack = () => {
    setStep('method-selection');
    setPaymentMethod(null);
    setError(null);
  };

  // Lidar com a seleção do método de pagamento
  const handleMethodSelected = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    setStep('payment-processing');
  };

  // Lidar com o sucesso no pagamento
  const handlePaymentSuccess = (transactionId: string, change?: number) => {
    console.log(`Pagamento bem-sucedido: ${transactionId}`);
    
    // Em um ambiente real, buscaríamos a transação completa do banco de dados
    // Aqui simularemos uma transação bem-sucedida
    const successTransaction: PaymentTransaction = {
      id: transactionId,
      type: paymentMethod!,
      status: 'approved',
      amount,
      currency: 'BRL',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDocument
      }
    };

    // Adicionar informações específicas por tipo de pagamento
    if (paymentMethod === 'cash' && change !== undefined) {
      setChangeAmount(change);
      successTransaction.cashInfo = {
        amountPaid: amount + change,
        changeAmount: change
      };
    }

    setTransaction(successTransaction);
    setStep('payment-complete');
    
    // Notificar o componente pai
    onPaymentComplete(successTransaction);
  };

  // Lidar com erro no pagamento
  const handlePaymentError = (errorMessage: string) => {
    console.error('Erro no pagamento:', errorMessage);
    setError(errorMessage);
  };

  // Enviar recibo por e-mail
  const handleSendEmail = async () => {
    if (!receiptEmail || !transaction) return;

    setSendingEmail(true);
    setError(null);
    
    try {
      // Em um ambiente real, chamaríamos a API para enviar o e-mail
      // Aqui apenas simulamos um envio bem-sucedido
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      
      // Resetar após 3 segundos
      setTimeout(() => {
        setEmailSent(false);
      }, 3000);
    } catch (err) {
      setError('Falha ao enviar o recibo por e-mail. Tente novamente.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar método de pagamento selecionado
  const renderPaymentMethod = () => {
    switch (paymentMethod) {
      case 'pix':
        return (
          <PixPayment
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            reference={reference}
            customerName={customerName}
            customerEmail={customerEmail}
            customerDocument={customerDocument}
          />
        );
      case 'credit':
      case 'debit':
        return (
          <CardPayment
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            reference={reference}
            customerName={customerName}
            customerEmail={customerEmail}
            customerDocument={customerDocument}
          />
        );
      case 'cash':
        return (
          <CashPayment
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            reference={reference}
          />
        );
      default:
        return (
          <div className="p-6 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span>Método de pagamento não implementado</span>
            </div>
          </div>
        );
    }
  };

  // Renderizar ícone do método de pagamento
  const renderPaymentIcon = () => {
    switch (paymentMethod) {
      case 'pix':
        return <QrCode className="h-6 w-6 text-primary" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="h-6 w-6 text-primary" />;
      case 'cash':
        return <Banknote className="h-6 w-6 text-primary" />;
      default:
        return null;
    }
  };

  // Renderizar recibo escondido (para impressão)
  const renderHiddenReceipt = () => (
    <div style={{ display: 'none' }}>
      <PaymentReceipt
        ref={receiptRef}
        transaction={transaction}
        companyName={companyName}
        companyDocument={companyDocument}
        companyAddress={companyAddress}
        companyPhone={companyPhone}
        logoUrl={logoUrl}
        orderReference={reference}
        orderItems={orderItems}
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Passo 1: Seleção do método de pagamento */}
      {step === 'method-selection' && (
        <PaymentMethodSelector 
          onSelect={handleMethodSelected}
          amount={amount}
        />
      )}

      {/* Passo 2: Processamento do pagamento */}
      {step === 'payment-processing' && (
        <div>
          <div className="mb-4">
            <button 
              className="text-primary hover:text-primary-dark flex items-center"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para métodos de pagamento
            </button>
          </div>

          {renderPaymentMethod()}
        </div>
      )}

      {/* Passo 3: Confirmação de pagamento concluído */}
      {step === 'payment-complete' && transaction && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Concluído!</h2>
            <div className="text-lg text-gray-600">
              {formatCurrency(transaction.amount)} pago com sucesso via {
                transaction.type === 'pix' ? 'PIX' :
                transaction.type === 'credit' ? 'cartão de crédito' :
                transaction.type === 'debit' ? 'cartão de débito' :
                transaction.type === 'cash' ? 'dinheiro' : 
                transaction.type
              }
            </div>

            {/* Exibir troco, se houver */}
            {transaction.type === 'cash' && changeAmount > 0 && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg inline-block">
                <div className="flex items-center">
                  <Banknote className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Troco: {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recibo e ações */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              {renderPaymentIcon()}
              <span className="ml-2">Comprovante</span>
            </h3>

            {/* Versão simplificada do recibo */}
            <div className="border rounded-lg p-4 bg-white mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Transação:</span>
                <span className="text-sm font-medium">{transaction.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Data/Hora:</span>
                <span className="text-sm font-medium">
                  {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-green-600">Aprovado</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{formatCurrency(transaction.amount)}</span>
              </div>
            </div>

            {/* Opções para o recibo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ReactToPrint
                trigger={() => (
                  <button className="btn-outline py-2 w-full flex items-center justify-center">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Comprovante
                  </button>
                )}
                content={() => receiptRef.current}
              />
              
              <div className="relative">
                {emailSent ? (
                  <div className="btn-outline py-2 w-full bg-green-50 border-green-200 text-green-700 flex items-center justify-center">
                    <Check className="h-4 w-4 mr-2" />
                    E-mail Enviado!
                  </div>
                ) : (
                  <>
                    <div className="flex">
                      <input
                        type="email"
                        value={receiptEmail}
                        onChange={(e) => setReceiptEmail(e.target.value)}
                        placeholder="Enviar para e-mail"
                        className="input flex-grow rounded-r-none"
                      />
                      <button
                        className="btn-primary py-2 px-4 rounded-l-none"
                        onClick={handleSendEmail}
                        disabled={!receiptEmail || sendingEmail}
                      >
                        {sendingEmail ? (
                          <div className="animate-spin h-4 w-4 border-t-2 border-white rounded-full" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {error && (
                      <div className="absolute left-0 right-0 text-xs text-red-600 mt-1">
                        {error}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {onCancel && (
              <button
                className="btn-outline py-3 w-full"
                onClick={onCancel}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancelar Transação
              </button>
            )}
            <button
              className="btn-primary py-3 flex-1"
              onClick={() => window.location.reload()}
            >
              <Check className="h-5 w-5 mr-2" />
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Recibo oculto para impressão */}
      {renderHiddenReceipt()}
    </div>
  );
};

export default PaymentProcessor;