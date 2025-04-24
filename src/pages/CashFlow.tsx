import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Download, 
  Filter, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

const CashFlow: React.FC = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [monthView, setMonthView] = useState<string>('Maio 2025');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const dailyCashFlowData = [
    { day: '01', entradas: 3500, saidas: 1200, saldo: 2300 },
    { day: '02', entradas: 2800, saidas: 1600, saldo: 1200 },
    { day: '03', entradas: 3200, saidas: 1800, saldo: 1400 },
    { day: '04', entradas: 4100, saidas: 2300, saldo: 1800 },
    { day: '05', entradas: 3800, saidas: 2100, saldo: 1700 },
    { day: '06', entradas: 2200, saidas: 1900, saldo: 300 },
    { day: '07', entradas: 1800, saidas: 1500, saldo: 300 },
    { day: '08', entradas: 2900, saidas: 2000, saldo: 900 },
    { day: '09', entradas: 3600, saidas: 2200, saldo: 1400 },
    { day: '10', entradas: 3300, saidas: 1800, saldo: 1500 },
    { day: '11', entradas: 2900, saidas: 1900, saldo: 1000 },
    { day: '12', entradas: 2700, saidas: 2100, saldo: 600 },
    { day: '13', entradas: 3500, saidas: 2300, saldo: 1200 },
    { day: '14', entradas: 3800, saidas: 2500, saldo: 1300 },
    { day: '15', entradas: 4200, saidas: 2700, saldo: 1500 },
  ];

  const categoriesData = [
    { 
      id: 'vendas',
      name: 'Vendas', 
      type: 'entrada',
      amount: 51300, 
      transactions: [
        { date: '15/05/2025', description: 'Venda PDV - Diária', amount: 3420 },
        { date: '14/05/2025', description: 'Venda PDV - Diária', amount: 3560 },
        { date: '13/05/2025', description: 'Venda PDV - Diária', amount: 3210 },
        { date: '12/05/2025', description: 'Venda PDV - Diária', amount: 2980 },
        { date: '11/05/2025', description: 'Venda PDV - Diária', amount: 3150 },
      ]
    },
    { 
      id: 'fornecedores',
      name: 'Fornecedores', 
      type: 'saida',
      amount: 18600, 
      transactions: [
        { date: '15/05/2025', description: 'Laticínios Silva', amount: 2350 },
        { date: '12/05/2025', description: 'Distribuidora de Farinhas', amount: 3500 },
        { date: '10/05/2025', description: 'Açúcar & Cia', amount: 1800 },
        { date: '08/05/2025', description: 'Embalagens Express', amount: 1200 },
      ]
    },
    { 
      id: 'folha',
      name: 'Folha de Pagamento', 
      type: 'saida',
      amount: 12500, 
      transactions: [
        { date: '05/05/2025', description: 'Salários - Maio', amount: 9800 },
        { date: '05/05/2025', description: 'Adiantamentos', amount: 1500 },
        { date: '10/05/2025', description: 'Horas extras', amount: 1200 },
      ]
    },
    { 
      id: 'impostos',
      name: 'Impostos', 
      type: 'saida',
      amount: 8900, 
      transactions: [
        { date: '15/05/2025', description: 'ICMS', amount: 2800 },
        { date: '15/05/2025', description: 'ISS', amount: 1900 },
        { date: '20/05/2025', description: 'Simples Nacional', amount: 4200 },
      ]
    },
    { 
      id: 'operacional',
      name: 'Despesas Operacionais', 
      type: 'saida',
      amount: 5600, 
      transactions: [
        { date: '10/05/2025', description: 'Aluguel', amount: 3500 },
        { date: '15/05/2025', description: 'Água', amount: 450 },
        { date: '18/05/2025', description: 'Energia', amount: 980 },
        { date: '05/05/2025', description: 'Internet', amount: 249 },
        { date: '07/05/2025', description: 'Manutenção equipamentos', amount: 450 },
      ]
    },
  ];

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const totalEntradas = categoriesData
    .filter(cat => cat.type === 'entrada')
    .reduce((sum, cat) => sum + cat.amount, 0);

  const totalSaidas = categoriesData
    .filter(cat => cat.type === 'saida')
    .reduce((sum, cat) => sum + cat.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-gray-500">Acompanhe suas entradas, saídas e o saldo do caixa</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-outline">
            <Calendar className="h-4 w-4 mr-2" />
            {monthView}
          </button>
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Entradas</h3>
              <p className="text-2xl font-bold text-gray-900">R$ {totalEntradas.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Saídas</h3>
              <p className="text-2xl font-bold text-gray-900">R$ {totalSaidas.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
              <p className="text-2xl font-bold text-green-600">R$ {saldo.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart view controls */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'daily' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setViewMode('daily')}
          >
            Diário
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'weekly' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setViewMode('weekly')}
          >
            Semanal
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setViewMode('monthly')}
          >
            Mensal
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn-outline py-2 px-3">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">Maio 2025</span>
          <button className="btn-outline py-2 px-3">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa {viewMode === 'daily' ? 'Diário' : viewMode === 'weekly' ? 'Semanal' : 'Mensal'}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyCashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="entradas" 
                stroke="#47A3F3" 
                fill="#47A3F3" 
                fillOpacity={0.6}
                name="Entradas"
              />
              <Area 
                type="monotone" 
                dataKey="saidas" 
                stroke="#F87171" 
                fill="#F87171" 
                fillOpacity={0.6}
                name="Saídas"
              />
              <Area 
                type="monotone" 
                dataKey="saldo" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entradas */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entradas por Categoria</h3>
          <div className="space-y-3">
            {categoriesData.filter(cat => cat.type === 'entrada').map(category => (
              <div key={category.id} className="animate-slide-in">
                <div 
                  className="flex justify-between items-center p-3 bg-blue-50 rounded-lg cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">{category.transactions.length} transações</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="font-bold text-gray-900 mr-3">R$ {category.amount.toLocaleString('pt-BR')}</p>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {expandedCategories.includes(category.id) && (
                  <div className="mt-2 pl-6 border-l-2 border-blue-200 animate-slide-up">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="py-2 text-left text-xs font-medium text-gray-500">Data</th>
                          <th className="py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                          <th className="py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.transactions.map((transaction, index) => (
                          <tr key={index} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 text-sm text-gray-600">{transaction.date}</td>
                            <td className="py-2 text-sm text-gray-800">{transaction.description}</td>
                            <td className="py-2 text-sm text-gray-800 text-right">R$ {transaction.amount.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Saídas */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saídas por Categoria</h3>
          <div className="space-y-3">
            {categoriesData.filter(cat => cat.type === 'saida').map(category => (
              <div key={category.id} className="animate-slide-in">
                <div 
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">{category.transactions.length} transações</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="font-bold text-gray-900 mr-3">R$ {category.amount.toLocaleString('pt-BR')}</p>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {expandedCategories.includes(category.id) && (
                  <div className="mt-2 pl-6 border-l-2 border-red-200 animate-slide-up">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="py-2 text-left text-xs font-medium text-gray-500">Data</th>
                          <th className="py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                          <th className="py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.transactions.map((transaction, index) => (
                          <tr key={index} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 text-sm text-gray-600">{transaction.date}</td>
                            <td className="py-2 text-sm text-gray-800">{transaction.description}</td>
                            <td className="py-2 text-sm text-gray-800 text-right">R$ {transaction.amount.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projeções e Recomendações */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projeções e Recomendações</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="font-medium text-gray-900">Projeção de Fluxo de Caixa</h4>
            <p className="text-sm text-gray-600 mt-1">
              Com base no histórico, projetamos um saldo de caixa de R$ 34.560,00 para o final do mês, 
              representando um aumento de 8,2% em relação ao mês anterior.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h4 className="font-medium text-gray-900">Oportunidade de Melhor Data de Pagamento</h4>
            <p className="text-sm text-gray-600 mt-1">
              Recomendamos adiar o pagamento do fornecedor Laticínios Silva (R$ 2.350,00) do dia 15/05 para 20/05 
              para melhorar o fluxo de caixa na primeira quinzena sem incorrer em juros.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <h4 className="font-medium text-gray-900">Alerta de Sazonalidade</h4>
            <p className="text-sm text-gray-600 mt-1">
              Observamos que em Junho as vendas tendem a cair 15% com base no histórico dos últimos 2 anos. 
              Recomendamos preparar um plano de marketing e promoções para esse período.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;