import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Lock, 
  ShieldCheck
} from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  clientSecret?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel?: () => void;
  showBilling?: boolean;
  buttonText?: string;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  clientSecret,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  showBilling = false,
  buttonText = 'Pagar'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  // Format amount for display
  const formattedAmount = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL'
  }).format(amount);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // If we have a client secret, use it to confirm the payment
      if (clientSecret) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: 'Client Name', // You would typically get this from a form
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'An error occurred during the payment process.');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          setPaymentStatus('success');
          onPaymentSuccess(paymentIntent.id);
        } else {
          throw new Error('Payment status is not successful.');
        }
      } else {
        // In a real app, you would create a payment intent on your server first
        // For demo purposes, we'll simulate a successful payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful payment
        const mockPaymentId = `pi_${Math.random().toString(36).substr(2, 9)}`;
        setPaymentStatus('success');
        onPaymentSuccess(mockPaymentId);
      }
    } catch (err) {
      console.error("Payment Error:", err);
      setPaymentStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while processing your payment.';
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle card element changes
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setErrorMessage(event.error ? event.error.message : null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <CreditCard className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Pagamento com Cartão</h2>
        </div>
        <p className="text-gray-600">
          Valor a pagar: {formattedAmount}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {paymentStatus === 'success' ? (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">Pagamento realizado com sucesso!</h3>
                <p className="text-green-700 mt-1">Seu pagamento foi confirmado.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Card details */}
              <div>
                <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-1">
                  Dados do Cartão
                </label>
                <div className="p-3 border border-gray-300 rounded-md bg-white">
                  <CardElement 
                    id="card-element"
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                      hidePostalCode: true,
                    }}
                    onChange={handleCardChange}
                  />
                </div>
                {errorMessage && (
                  <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                )}
              </div>

              {/* Billing details */}
              {showBilling && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço de Cobrança
                  </label>
                  <div className="p-3 border border-gray-300 rounded-md bg-white">
                    <AddressElement 
                      options={{
                        mode: 'shipping',
                        allowedCountries: ['BR'],
                        fields: {
                          phone: 'always',
                        },
                        validation: {
                          phone: {
                            required: 'always',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Payment status message */}
              {paymentStatus === 'processing' && (
                <div className="p-3 bg-blue-50 rounded-md flex items-center text-blue-700">
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  <span>Processando seu pagamento...</span>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="p-3 bg-red-50 rounded-md flex items-start text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage || 'Ocorreu um erro ao processar o pagamento.'}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              {onCancel && (
                <button
                  type="button"
                  className="btn-outline py-2 px-4"
                  onClick={onCancel}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
              )}
              
              <button
                type="submit"
                disabled={isProcessing || !stripe || !elements || !cardComplete}
                className="btn-primary py-2 px-4 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    {buttonText}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Payment security information */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center mb-1">
          <Lock className="h-3 w-3 mr-1" />
          <ShieldCheck className="h-3 w-3 mr-1" />
          <span>Pagamento Seguro</span>
        </div>
        <p>
          Seus dados são criptografados e protegidos com os mais altos padrões de segurança.
        </p>
      </div>
    </div>
  );
};

export default StripePaymentForm;