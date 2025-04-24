import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  QrCode, 
  ShoppingCart, 
  Package, 
  ChevronLeft, 
  Info,
  Check,
  AlertTriangle
} from 'lucide-react';
import PaymentProcessor from '../components/payment/PaymentProcessor';
import { PaymentTransaction } from '../types/payment';

/**
 * Página de demonstração do sistema de pagamento
 */
const PaymentDemo: React.FC = () => {
  // Estados para controlar o fluxo da demonstração
  const [showPaymentDemo, setShowPaymentDemo] = useState(false);
  const [amount, setAmount] = useState(99.90);
  const [lastTransaction, setLastTransaction] = useState<PaymentTransaction | null>(null);

  // Mock de itens para o pedido
  const sampleOrderItems = [
    {
      name: "Produto de exemplo 1",
      quantity: 2,
      unitPrice: 39.95,
      total: 79.90
    },
    {
      name: "Produto de exemplo 2",
      quantity: 1,
      unitPrice: 20.00,
      total: 20.00
    }
  ];

  // Lidar com a finalização do pagamento
  const handlePaymentComplete = (transaction: PaymentTransaction) => {
    console.log('Pagamento finalizado:', transaction);
    setLastTransaction(transaction);
  };

  // Formatar valor monetário
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <ChevronLeft 
          className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
          onClick={() => window.history.back()}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Pagamento Integrado</h1>
          <p className="text-gray-500">Demonstração das funcionalidades de pagamento</p>
        </div>
      </div>

      {/* Mostrar ou processador de pagamento ou a tela de entrada */}
      {showPaymentDemo ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <button 
            className="text-primary flex items-center mb-4"
            onClick={() => setShowPaymentDemo(false)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para configurações
          </button>
          
          <PaymentProcessor 
            amount={amount}
            reference="DEMO-123456"
            customerName="Cliente Exemplo"
            customerEmail="cliente@exemplo.com"
            customerDocument="123.456.789-00"
            orderItems={sampleOrderItems}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setShowPaymentDemo(false)}
            companyName="Controlaí Demo"
            companyDocument="12.345.678/0001-90"
            companyAddress="Av. Paulista, 1000 - São Paulo/SP"
            companyPhone="(11) 4321-1234"
            logoUrl=""
          />
        </div>
      ) : (
        <div>
          {/* Visão geral do sistema de pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Múltiplos Métodos</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Processe pagamentos via PIX, cartões de crédito/débito e dinheiro com uma interface unificada e intuitiva.
              </p>
              <div className="flex space-x-2 mt-2">
                <QrCode className="h-6 w-6 text-gray-400" />
                <CreditCard className="h-6 w-6 text-gray-400" />
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Checkout Completo</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Integração perfeita com seu sistema de vendas, com validação em tempo real e confirmação instantânea.
              </p>
              <ul className="text-sm space-y-1 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  Validação em tempo real
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  Comprovantes digitais
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  Múltiplas formas de pagamento
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">Segurança Total</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Implementação com padrões de segurança PCI DSS, criptografia de ponta a ponta e proteção contra fraudes.
              </p>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <div className="flex items-start">
                  <Info className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Todos os dados sensíveis são protegidos com criptografia avançada e nunca são armazenados localmente.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuração da demonstração */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Iniciar Demonstração</h3>
            
            <div className="max-w-md mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor para pagamento
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="input pl-10 pr-12"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setAmount(99.90)}
                    className="h-full py-2 px-3 border-l border-gray-300 text-gray-500 hover:text-gray-900"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <button 
              className="btn-primary py-3 px-6"
              onClick={() => setShowPaymentDemo(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Iniciar Demonstração de Pagamento
            </button>
          </div>

          {/* Última transação */}
          {lastTransaction && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Última Transação</h3>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Pagamento Processado com Sucesso</h4>
                    <p className="text-green-700 mt-1">
                      {formatCurrency(lastTransaction.amount)} via {
                        lastTransaction.type === 'pix' ? 'PIX' :
                        lastTransaction.type === 'credit' ? 'Cartão de Crédito' :
                        lastTransaction.type === 'debit' ? 'Cartão de Débito' :
                        lastTransaction.type === 'cash' ? 'Dinheiro' :
                        lastTransaction.type
                      }
                    </p>
                    <div className="mt-2 text-sm">
                      <div><strong>ID:</strong> {lastTransaction.id}</div>
                      <div><strong>Data/Hora:</strong> {new Date(lastTransaction.createdAt).toLocaleString('pt-BR')}</div>
                      <div><strong>Status:</strong> {
                        lastTransaction.status === 'approved' ? 'Aprovado' :
                        lastTransaction.status === 'pending' ? 'Pendente' :
                        lastTransaction.status === 'denied' ? 'Negado' :
                        lastTransaction.status === 'cancelled' ? 'Cancelado' :
                        lastTransaction.status
                      }</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Esta é uma transação de demonstração e não representa um pagamento real.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentDemo;