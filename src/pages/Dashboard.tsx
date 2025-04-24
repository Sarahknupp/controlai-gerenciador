import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  Clock, 
  ShoppingCart 
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
  PieChart,
  Pie,
  Legend
} from 'recharts';

const Dashboard: React.FC = () => {
  // Sample data for charts
  const cashFlowData = [
    { name: '01/05', entrada: 4000, saida: 2400 },
    { name: '08/05', entrada: 3000, saida: 1398 },
    { name: '15/05', entrada: 5000, saida: 3800 },
    { name: '22/05', entrada: 2780, saida: 3908 },
    { name: '29/05', entrada: 4890, saida: 4800 },
    { name: '05/06', entrada: 3390, saida: 2800 },
    { name: '12/06', entrada: 4490, saida: 2300 },
  ];

  const salesPerCategoryData = [
    { name: 'Pães', value: 35 },
    { name: 'Doces', value: 25 },
    { name: 'Revenda', value: 20 },
    { name: 'Bolos', value: 15 },
    { name: 'Outros', value: 5 },
  ];

  const salesPerCategoryColors = ['#E3A65C', '#FFC0CB', '#A0C4FF', '#9BF6FF', '#BDB2FF'];

  const topProductsData = [
    { name: 'Pão Francês', value: 12000 },
    { name: 'Pão de Queijo', value: 8000 },
    { name: 'Sonho', value: 5000 },
    { name: 'Bolo de Chocolate', value: 4500 },
    { name: 'Café', value: 3000 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <button className="btn-outline">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Card */}
        <div className="card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Vendas (Hoje)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ 3.459,20</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">12.5%</span>
            </div>
            <span className="text-sm text-gray-500 ml-2">desde ontem</span>
          </div>
        </div>

        {/* Cash Flow Card */}
        <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo em Caixa</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ 24.780,15</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">8.2%</span>
            </div>
            <span className="text-sm text-gray-500 ml-2">desde o último mês</span>
          </div>
        </div>

        {/* Debts Card */}
        <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Dívidas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ 45.650,00</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-red-600">
              <ArrowDown className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">3.5%</span>
            </div>
            <span className="text-sm text-gray-500 ml-2">desde o último mês</span>
          </div>
        </div>

        {/* Due Payments Card */}
        <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pagamentos Próximos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ 8.230,45</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-gray-500">
            <span className="text-sm">Próximos 7 dias</span>
            <span className="text-sm font-medium ml-2 text-orange-600">3 pagamentos</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa (Maio - Junho)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                <Tooltip formatter={(value) => `R$ ${value}`} />
                <Area 
                  type="monotone" 
                  dataKey="entrada" 
                  stackId="1"
                  stroke="#47A3F3" 
                  fill="#47A3F3" 
                  fillOpacity={0.6}
                  name="Entradas"
                />
                <Area 
                  type="monotone" 
                  dataKey="saida" 
                  stackId="2" 
                  stroke="#F87171" 
                  fill="#F87171" 
                  fillOpacity={0.6}
                  name="Saídas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-80">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesPerCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {salesPerCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={salesPerCategoryColors[index % salesPerCategoryColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                  <YAxis dataKey="name" type="category" scale="band" stroke="#9CA3AF" fontSize={10} width={100} />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#E3A65C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Alerts */}
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Pagamento</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Empréstimo Banco XYZ</p>
                  <p className="text-xs text-gray-500">Vence em 2 dias • R$ 3.200,00</p>
                </div>
              </div>
              <button className="btn-primary py-1 px-3 text-sm">Pagar</button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Fornecedor Laticínios</p>
                  <p className="text-xs text-gray-500">Vence em 5 dias • R$ 1.850,90</p>
                </div>
              </div>
              <button className="btn-primary py-1 px-3 text-sm">Pagar</button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Aluguel</p>
                  <p className="text-xs text-gray-500">Vence em 7 dias • R$ 3.500,00</p>
                </div>
              </div>
              <button className="btn-primary py-1 px-3 text-sm">Pagar</button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendações Inteligentes</h3>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-medium text-gray-900">Otimização de Estoque</h4>
              <p className="text-sm text-gray-600 mt-1">
                O estoque de farinha especial está 35% acima do necessário. 
                Considere reduzir a próxima compra para economizar R$ 850,00 no próximo mês.
              </p>
              <div className="flex mt-3">
                <button className="text-primary text-sm font-medium">Ver detalhes</button>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="font-medium text-gray-900">Oportunidade de Negociação de Dívida</h4>
              <p className="text-sm text-gray-600 mt-1">
                O Banco ABC está oferecendo desconto de 15% para quitação antecipada do empréstimo. 
                Economia potencial de R$ 3.450,00.
              </p>
              <div className="flex mt-3">
                <button className="text-green-600 text-sm font-medium">Ver proposta</button>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-gray-900">Análise de Vendas</h4>
              <p className="text-sm text-gray-600 mt-1">
                As vendas de produtos integrais aumentaram 23% no último mês. 
                Considere ampliar esta linha de produtos para atender à demanda crescente.
              </p>
              <div className="flex mt-3">
                <button className="text-blue-600 text-sm font-medium">Ver relatório completo</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;