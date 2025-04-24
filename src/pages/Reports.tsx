import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  LineChart, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Filter,
  FileText,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { 
  LineChart as ReLineChart, 
  Line, 
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
  Legend,
  AreaChart,
  Area
} from 'recharts';

const Reports: React.FC = () => {
  const [reportCategory, setReportCategory] = useState<'financial' | 'sales' | 'inventory' | 'hr'>('financial');
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Sample data for financial reports
  const financialData = [
    { month: 'Jan', receita: 42000, despesa: 36000, lucro: 6000 },
    { month: 'Fev', receita: 44000, despesa: 37500, lucro: 6500 },
    { month: 'Mar', receita: 48000, despesa: 38000, lucro: 10000 },
    { month: 'Abr', receita: 46000, despesa: 39000, lucro: 7000 },
    { month: 'Mai', receita: 51000, despesa: 40000, lucro: 11000 },
  ];

  // Sample data for sales by category
  const salesByCategoryData = [
    { name: 'Pães', value: 35 },
    { name: 'Doces', value: 25 },
    { name: 'Bolos', value: 15 },
    { name: 'Salgados', value: 15 },
    { name: 'Bebidas', value: 10 },
  ];

  const salesByCategoryColors = ['#E3A65C', '#FFC0CB', '#A0C4FF', '#9BF6FF', '#BDB2FF'];

  // Sample data for sales by day of week
  const salesByDayData = [
    { day: 'Segunda', sales: 4200 },
    { day: 'Terça', sales: 4800 },
    { day: 'Quarta', sales: 5100 },
    { day: 'Quinta', sales: 4900 },
    { day: 'Sexta', sales: 6200 },
    { day: 'Sábado', sales: 8500 },
    { day: 'Domingo', sales: 3500 },
  ];

  // Sample data for inventory value
  const inventoryValueData = [
    { category: 'Ingredientes', value: 12500 },
    { category: 'Produtos Acabados', value: 8500 },
    { category: 'Produtos de Revenda', value: 6800 },
    { category: 'Embalagens', value: 3200 },
  ];

  // Generate available reports based on category
  const getReportsList = () => {
    switch (reportCategory) {
      case 'financial':
        return [
          { id: 1, name: 'DRE Simplificada', icon: <BarChartIcon className="h-5 w-5 text-primary" />, type: 'financial' },
          { id: 2, name: 'Fluxo de Caixa', icon: <LineChart className="h-5 w-5 text-blue-600" />, type: 'financial' },
          { id: 3, name: 'Análise de Dívidas', icon: <TrendingUp className="h-5 w-5 text-red-600" />, type: 'financial' },
          { id: 4, name: 'Projeção Financeira', icon: <LineChart className="h-5 w-5 text-green-600" />, type: 'financial' },
        ];
      case 'sales':
        return [
          { id: 5, name: 'Vendas por Produto', icon: <BarChartIcon className="h-5 w-5 text-primary" />, type: 'sales' },
          { id: 6, name: 'Vendas por Categoria', icon: <PieChartIcon className="h-5 w-5 text-blue-600" />, type: 'sales' },
          { id: 7, name: 'Vendas por Período', icon: <LineChart className="h-5 w-5 text-green-600" />, type: 'sales' },
          { id: 8, name: 'Análise de Clientes', icon: <BarChartIcon className="h-5 w-5 text-purple-600" />, type: 'sales' },
        ];
      case 'inventory':
        return [
          { id: 9, name: 'Valor do Estoque', icon: <BarChartIcon className="h-5 w-5 text-primary" />, type: 'inventory' },
          { id: 10, name: 'Giro de Estoque', icon: <LineChart className="h-5 w-5 text-blue-600" />, type: 'inventory' },
          { id: 11, name: 'Produtos com Estoque Baixo', icon: <BarChartIcon className="h-5 w-5 text-red-600" />, type: 'inventory' },
          { id: 12, name: 'Desperdício e Perdas', icon: <PieChartIcon className="h-5 w-5 text-orange-600" />, type: 'inventory' },
        ];
      case 'hr':
        return [
          { id: 13, name: 'Folha de Pagamento', icon: <BarChartIcon className="h-5 w-5 text-primary" />, type: 'hr' },
          { id: 14, name: 'Horas Extras por Funcionário', icon: <BarChartIcon className="h-5 w-5 text-blue-600" />, type: 'hr' },
          { id: 15, name: 'Produtividade', icon: <LineChart className="h-5 w-5 text-green-600" />, type: 'hr' },
          { id: 16, name: 'Absenteísmo', icon: <LineChart className="h-5 w-5 text-red-600" />, type: 'hr' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500">Análise detalhada do desempenho do negócio</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-outline">
            <Calendar className="h-4 w-4 mr-2" />
            Maio 2025
          </button>
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportCategory === 'financial' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setReportCategory('financial')}
        >
          Financeiro
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportCategory === 'sales' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setReportCategory('sales')}
        >
          Vendas
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportCategory === 'inventory' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setReportCategory('inventory')}
        >
          Estoque
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportCategory === 'hr' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setReportCategory('hr')}
        >
          RH
        </button>
      </div>

      {/* Date range filter */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button 
          className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'day' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setDateRange('day')}
        >
          Diário
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'week' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setDateRange('week')}
        >
          Semanal
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'month' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setDateRange('month')}
        >
          Mensal
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'quarter' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setDateRange('quarter')}
        >
          Trimestral
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'year' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setDateRange('year')}
        >
          Anual
        </button>
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main financial chart */}
        <div className="card md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {reportCategory === 'financial' && 'Demonstrativo de Resultados'}
              {reportCategory === 'sales' && 'Vendas por Categoria'}
              {reportCategory === 'inventory' && 'Valor do Estoque por Categoria'}
              {reportCategory === 'hr' && 'Folha de Pagamento'}
            </h3>
            <button className="text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {reportCategory === 'financial' && (
                <BarChart
                  data={financialData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#4F46E5" />
                  <Bar dataKey="despesa" name="Despesa" fill="#F87171" />
                  <Bar dataKey="lucro" name="Lucro" fill="#10B981" />
                </BarChart>
              )}

              {reportCategory === 'sales' && (
                <div className="grid grid-cols-2 h-full">
                  <PieChart>
                    <Pie
                      data={salesByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={salesByCategoryColors[index % salesByCategoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                  <BarChart
                    data={salesByDayData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Bar dataKey="sales" name="Vendas" fill="#E3A65C" />
                  </BarChart>
                </div>
              )}

              {reportCategory === 'inventory' && (
                <BarChart
                  data={inventoryValueData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} />
                  <YAxis dataKey="category" type="category" width={90} />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" name="Valor" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              )}

              {reportCategory === 'hr' && (
                <BarChart
                  data={[
                    { month: 'Jan', valor: 22500 },
                    { month: 'Fev', valor: 23000 },
                    { month: 'Mar', valor: 24200 },
                    { month: 'Abr', valor: 24800 },
                    { month: 'Mai', valor: 25500 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="valor" name="Folha de Pagamento" fill="#8B5CF6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports list */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Disponíveis</h3>
          <div className="space-y-3">
            {getReportsList().map(report => (
              <div 
                key={report.id} 
                className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                    {report.icon}
                  </div>
                  <span className="font-medium text-gray-900">{report.name}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Recentes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Vendas do Último Mês</p>
                  <p className="text-xs text-gray-500">Gerado em: 02/05/2025</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Download className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">DRE Trimestral</p>
                  <p className="text-xs text-gray-500">Gerado em: 15/04/2025</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Download className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Inventário Completo</p>
                  <p className="text-xs text-gray-500">Gerado em: 30/03/2025</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Download className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Análise de Dívidas</p>
                  <p className="text-xs text-gray-500">Gerado em: 22/03/2025</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Download className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;