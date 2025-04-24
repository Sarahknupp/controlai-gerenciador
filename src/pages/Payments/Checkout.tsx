import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  ArrowLeft, 
  CreditCard, 
  Check, 
  Shield, 
  AlertTriangle,
  Receipt,
  Loader,
  ChevronRight
} from 'lucide-react';
import StripePaymentForm from '../../components/payment/StripePaymentForm';
import { useStripe } from '../../context/StripeContext';

// Initialize Stripe - in real app, get this from env var
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface CheckoutProps {}

const Checkout: React.FC<CheckoutProps> = () => {
  const { productId, planId } = useParams<{ productId?: string; planId?: string }>();
  const navigate = useNavigate();
  const { createPaymentIntent, loading } = useStripe();
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState({
    name: 'Plano Premium',
    price: 125.90,
    description: 'Acesso a todos os recursos premium por 1 mês'
  });
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch product details and create a payment intent
  useEffect(() => {
    const fetchProductAndCreateIntent = async () => {
      try {
        // In a real app, you would fetch product details from an API
        // For this example, we'll use the mock data above
        
        // Create a payment intent
        const { clientSecret } = await createPaymentIntent(productDetails.price);
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error initializing checkout:', err);
        setError('Não foi possível inicializar o checkout. Por favor, tente novamente.');
      }
    };
    
    fetchProductAndCreateIntent();
  }, [productId, planId]);
  
  // Handle successful payment
  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentStatus('success');
    
    // In a real app, you would confirm the payment with your backend
    // and then navigate to a success page or update the UI
    
    console.log('Payment successful:', paymentId);
    
    // After a delay, redirect to a success page
    setTimeout(() => {
      navigate('/payment-success');
    }, 3000);
  };
  
  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setPaymentStatus('error');
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-16">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
          <p className="text-gray-600">Você está adquirindo {productDetails.name}</p>
        </div>
        
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Resumo do Pedido</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">{productDetails.name}</span>
              <span className="font-medium">{new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL'
              }).format(productDetails.price)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Taxa de processamento</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Total</span>
              <span>{new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL'
              }).format(productDetails.price)}</span>
            </div>
          </div>
        </div>
        
        {/* Payment Form */}
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center py-16">
            <Loader className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Inicializando pagamento...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-lg shadow-sm border">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Erro no pagamento</h3>
                <p className="mt-1 text-red-700">{error}</p>
                <button
                  className="mt-4 btn-primary py-2 px-4"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret: clientSecret || undefined }}>
            <StripePaymentForm
              amount={productDetails.price}
              clientSecret={clientSecret || undefined}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={() => navigate('/')}
              showBilling={true}
              buttonText="Finalizar Pagamento"
            />
          </Elements>
        )}
        
        {/* Back button */}
        <div className="mt-6 text-center">
          <button 
            className="text-primary hover:text-primary-dark font-medium flex items-center justify-center mx-auto"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-8">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="flex flex-col items-center">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <span className="text-xs text-gray-600">Pagamento Seguro</span>
            </div>
            <div className="flex flex-col items-center">
              <CreditCard className="h-8 w-8 text-primary mb-2" />
              <span className="text-xs text-gray-600">Criptografado</span>
            </div>
            <div className="flex flex-col items-center">
              <Receipt className="h-8 w-8 text-primary mb-2" />
              <span className="text-xs text-gray-600">Nota Fiscal</span>
            </div>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            Seus dados de pagamento são processados com segurança pela Stripe e criptografados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;