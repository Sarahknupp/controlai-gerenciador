import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, Check, ShieldCheck, FileText, DollarSign, Users, Package } from 'lucide-react';
import { StripeProvider } from '../../context/StripeContext';

const PaymentsHome: React.FC = () => {
  return (
    <StripeProvider>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Controlaí Pagamentos</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Implemente pagamentos seguros e flexíveis para seu negócio.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="h-12 w-12 rounded-full bg-primary-light/20 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Múltiplos Métodos</h3>
              <p className="text-gray-600 mb-4">
                Aceite pagamentos com cartão de crédito, boleto, PIX, e mais.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Cartão de crédito em até 12x
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  PIX com confirmação automática
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Boleto com vencimento flexível
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Assinaturas Recorrentes</h3>
              <p className="text-gray-600 mb-4">
                Implemente cobranças recorrentes para seus planos e serviços.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Cobranças mensais ou anuais
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Upgrages e downgrades de plano
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Notificações automáticas
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Segurança Garantida</h3>
              <p className="text-gray-600 mb-4">
                Processamento seguro com proteção contra fraudes e conformidade PCI.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Criptografia de ponta a ponta
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Detecção inteligente de fraudes
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Conformidade com normas PCI DSS
                </li>
              </ul>
            </div>
          </div>

          {/* Demo sections */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Experimente Nossas Soluções</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Demo
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Pagamento Individual</h3>
                <p className="text-gray-600 mb-4">
                  Experimente nossa solução de pagamentos para itens individuais ou carrinho de compras.
                </p>
                <Link 
                  to="/plans/checkout/basic"
                  className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                >
                  Ver demonstração
                  <CreditCard className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Demo
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Planos e Assinaturas</h3>
                <p className="text-gray-600 mb-4">
                  Veja como funciona nosso sistema de assinaturas com diferentes planos e preços.
                </p>
                <Link 
                  to="/plans" 
                  className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                >
                  Ver demonstração
                  <Users className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Integration section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Integração Simples e Rápida</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="font-bold text-gray-900">1</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Configure</h3>
                  <p className="text-sm text-gray-600">
                    Conecte sua conta Stripe ao Controlaí em apenas alguns cliques
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="font-bold text-gray-900">2</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Personalize</h3>
                  <p className="text-sm text-gray-600">
                    Configure produtos, preços e opções de pagamento
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="font-bold text-gray-900">3</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Receba</h3>
                  <p className="text-sm text-gray-600">
                    Acompanhe seus pagamentos e receba os valores diretamente em sua conta
                  </p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Link to="/setup" className="btn-primary py-2 px-6 inline-flex items-center">
                  Começar Agora
                  <Package className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StripeProvider>
  );
};

export default PaymentsHome;