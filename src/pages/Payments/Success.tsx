import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isConfetti, setIsConfetti] = useState(true);
  
  // Get payment details from URL params
  const paymentId = searchParams.get('payment_id') || 'unknown';
  const orderNumber = searchParams.get('order') || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  
  // Simulate confetti effect
  useEffect(() => {
    // In a real app, you might want to use a confetti library
    const timer = setTimeout(() => {
      setIsConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-16 relative overflow-hidden">
      {isConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {/* This would be replaced with a proper confetti animation in a real app */}
          <div className="absolute animate-fade-in" style={{ top: '10%', left: '20%', width: '10px', height: '10px', background: '#FF5733', transform: 'rotate(45deg)' }}></div>
          <div className="absolute animate-fade-in" style={{ top: '15%', left: '45%', width: '15px', height: '15px', background: '#33FF57', transform: 'rotate(20deg)' }}></div>
          <div className="absolute animate-fade-in" style={{ top: '25%', left: '75%', width: '12px', height: '12px', background: '#3357FF', transform: 'rotate(60deg)' }}></div>
          <div className="absolute animate-fade-in" style={{ top: '30%', left: '30%', width: '8px', height: '8px', background: '#F3FF33', transform: 'rotate(15deg)' }}></div>
        </div>
      )}
      
      <div className="max-w-md mx-auto px-4">
        {/* Success message */}
        <div className="text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
          <p className="text-gray-600">Seu pagamento foi processado com sucesso.</p>
        </div>
        
        {/* Order details */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Pedido</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Número do Pedido</span>
              <span className="font-medium">{orderNumber}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">ID da Transação</span>
              <span className="font-medium">{paymentId}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Data</span>
              <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Aprovado</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button className="btn-outline py-2 flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            Baixar Recibo
          </button>
          
          <Link to="/dashboard" className="btn-primary py-2 flex items-center justify-center">
            <ArrowRight className="h-5 w-5 mr-2" />
            Acessar Produto
          </Link>
        </div>
        
        {/* Help text */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Você receberá um email de confirmação com os detalhes da sua compra em breve.
          </p>
          
          <Link to="/" className="text-primary hover:text-primary-dark font-medium flex items-center justify-center mx-auto">
            <Home className="h-4 w-4 mr-1" />
            Voltar para a página principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;