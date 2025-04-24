import React from 'react';
import { CheckCircle, X, User, Clock, Download, Gift, Shield } from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlanCardProps {
  title: string;
  price: number;
  period: 'month' | 'year';
  features: PlanFeature[];
  highlighted?: boolean;
  popular?: boolean;
  onSelect: () => void;
  showAnnualSaving?: boolean;
  disabled?: boolean;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title,
  price,
  period,
  features,
  highlighted = false,
  popular = false,
  onSelect,
  showAnnualSaving = false,
  disabled = false
}) => {
  // Calculate monthly equivalent for annual plans for showing savings
  const monthlySaving = period === 'year' ? Math.round((price / 12) * 0.25) : 0;
  
  return (
    <div 
      className={`rounded-lg overflow-hidden transition-all ${
        highlighted 
          ? 'border-2 border-primary shadow-lg transform scale-105 z-10' 
          : 'border border-gray-200 shadow'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {/* Popular badge */}
      {popular && (
        <div className="bg-primary text-white text-center py-1 text-sm font-medium uppercase">
          Mais popular
        </div>
      )}
      
      {/* Plan header */}
      <div className={`p-6 ${highlighted ? 'bg-primary-light/10' : 'bg-white'}`}>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-extrabold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
          </span>
          <span className="ml-1 text-gray-500">/{period === 'month' ? 'mês' : 'ano'}</span>
        </div>
        
        {showAnnualSaving && period === 'year' && (
          <p className="mt-1 text-sm text-green-600">
            Economia de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlySaving)} por mês
          </p>
        )}
      </div>
      
      {/* Features */}
      <div className="px-6 pt-4 pb-8 bg-white">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <X className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              )}
              <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-500 line-through'}`}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
        
        <button
          onClick={onSelect}
          className={`w-full mt-6 py-2 px-4 rounded-md font-medium ${
            highlighted 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          Selecionar Plano
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;