import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info, AlertTriangle } from 'lucide-react';
import SubscriptionPlanCard from '../../components/payment/SubscriptionPlanCard';

const plans = [
  {
    id: 'basic',
    title: 'Básico',
    monthlyPrice: 89.90,
    yearlyPrice: 899.00,
    features: [
      { name: 'Até 500 produtos', included: true },
      { name: 'Controle de estoque básico', included: true },
      { name: 'Relatórios essenciais', included: true },
      { name: 'Emissão de NFCe', included: true },
      { name: '1 usuário', included: true },
      { name: 'Controle financeiro', included: false },
      { name: 'Gestão de produção', included: false },
      { name: 'Aplicativo Mobile', included: false },
      { name: 'Integrações', included: false },
      { name: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'standard',
    title: 'Padrão',
    monthlyPrice: 149.90,
    yearlyPrice: 1499.00,
    features: [
      { name: 'Até 3.000 produtos', included: true },
      { name: 'Controle de estoque completo', included: true },
      { name: 'Todos os relatórios', included: true },
      { name: 'Emissão de NFCe/NFe', included: true },
      { name: 'Até 3 usuários', included: true },
      { name: 'Controle financeiro', included: true },
      { name: 'Gestão de produção', included: true },
      { name: 'Aplicativo Mobile', included: false },
      { name: 'Integrações', included: false },
      { name: 'Suporte prioritário', included: false },
    ],
    popular: true,
    highlighted: true,
  },
  {
    id: 'premium',
    title: 'Premium',
    monthlyPrice: 249.90,
    yearlyPrice: 2499.00,
    features: [
      { name: 'Produtos ilimitados', included: true },
      { name: 'Controle de estoque completo', included: true },
      { name: 'Todos os relatórios', included: true },
      { name: 'Emissão de NFCe/NFe', included: true },
      { name: 'Usuários ilimitados', included: true },
      { name: 'Controle financeiro', included: true },
      { name: 'Gestão de produção', included: true },
      { name: 'Aplicativo Mobile', included: true },
      { name: 'Integrações', included: true },
      { name: 'Suporte prioritário', included: true },
    ],
  }
];

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  
  const handleSelectPlan = (planId: string) => {
    // Navigate to checkout with the selected plan
    navigate(`/checkout/${planId}?period=${billingPeriod}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Escolha seu plano</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Selecione o plano que melhor atende às necessidades do seu negócio.
            Todos os planos incluem suporte técnico e atualizações gratuitas.
          </p>
          
          {/* Billing period toggle */}
          <div className="mt-8">
            <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingPeriod('month')}
                className={`py-2 px-4 rounded-md text-sm font-medium ${
                  billingPeriod === 'month' 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('year')}
                className={`py-2 px-4 rounded-md text-sm font-medium ${
                  billingPeriod === 'year' 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Anual
              </button>
            </div>
            
            {billingPeriod === 'year' && (
              <div className="mt-2 inline-flex items-center bg-green-100 text-green-800 text-sm font-medium py-1 px-3 rounded-full">
                <Check className="h-4 w-4 mr-1" />
                Economize 15%
              </div>
            )}
          </div>
        </div>
        
        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              title={plan.title}
              price={billingPeriod === 'month' ? plan.monthlyPrice : plan.yearlyPrice}
              period={billingPeriod}
              features={plan.features}
              highlighted={plan.highlighted}
              popular={plan.popular}
              showAnnualSaving={billingPeriod === 'year'}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
        
        {/* Informações adicionais */}
        <div className="max-w-3xl mx-auto mt-16 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">Informações importantes sobre os planos</h3>
                <p className="text-blue-700 mt-1">
                  Todos os planos incluem treinamento inicial, suporte por email e atualizações gratuitas.
                  Para mais informações sobre limites e funcionalidades, consulte a documentação completa.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Perguntas Frequentes</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Posso trocar de plano depois?</h3>
                  <p className="text-gray-600 text-sm">
                    Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                    As cobranças serão ajustadas proporcionalmente.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Quais formas de pagamento são aceitas?</h3>
                  <p className="text-gray-600 text-sm">
                    Aceitamos cartões de crédito, PIX e boleto bancário.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">É possível cancelar a assinatura?</h3>
                  <p className="text-gray-600 text-sm">
                    Sim, você pode cancelar sua assinatura a qualquer momento. Não cobramos taxas de cancelamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;