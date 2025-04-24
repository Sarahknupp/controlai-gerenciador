import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart2, 
  ChevronLeft,
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users, 
  ShoppingCart,
  Plus,
  Bell,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  FileDown,
  FileText,
  Clock,
  X
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
import { salesAnalyticsService } from '../../services/salesAnalyticsService';
import { SalesMetric, SalesChart, SalesReportParams, SalesAlertConfig } from '../../types/api';

/**
 * Página de análise de vendas com dashboard analítico
 */
const SalesAnalytics: React.FC = () => {
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SalesMetric[]>([]);
  const [charts, setCharts] = useState<SalesChart[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [reportParams, setReportParams] = useState<SalesReportParams>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'day'
  });
  const [alertConfig, setAlertConfig] = useState<Omit<SalesAlertConfig, 'id'>>({
    metricId: '',
    condition: 'lt',
    value: 0,
    channels: ['email', 'system'],
    recipients: [''],
    active: true,
    message: ''
  });
  
  // Ref para o elemento de dados do dashboard
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Buscar dados do dashboard ao inicializar e quando o período mudar
  useEffect(() => {
    fetchDashboardData();
  }, [period]);
  
  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await salesAnalyticsService.getDashboardData(period);
      
      // Atualizar componentes do dashboard
      setMetrics(data.metrics);
      setCharts(data.charts);
      setTopProducts(data.topProducts);
      setTopCustomers(data.topCustomers);
      setRecentSales(data.recentSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gerar um relatório de vendas
  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar parâmetros
      if (!reportParams.startDate || !reportParams.endDate) {
        throw new Error('As datas inicial e final são obrigatórias');
      }
      
      const start = new Date(reportParams.startDate);
      const end = new Date(reportParams.endDate);
      
      if (start > end) {
        throw new Error('A data inicial deve ser anterior à data final');
      }
      
      // Gerar o relatório
      const reportUrl = await salesAnalyticsService.generateSalesReport(reportParams);
      
      // Exibir mensagem de sucesso
      setSuccess(`Relatório gerado com sucesso. <a href="${reportUrl}" target="_blank" class="text-primary underline">Baixar relatório</a>`);
      
      // Fechar o modal
      setShowReportModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configurar um alerta
  const configureAlert = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar configuração
      if (!alertConfig.metricId) {
        throw new Error('Selecione uma métrica para o alerta');
      }
      
      if (!alertConfig.message) {
        throw new Error('Defina uma mensagem para o alerta');
      }
      
      // Criar o alerta
      const alertId = await salesAnalyticsService.configureAlert(alertConfig);
      
      // Exibir mensagem de sucesso
      setSuccess(`Alerta configurado com sucesso (ID: ${alertId})`);
      
      // Fechar o modal
      setShowAlertModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar alerta');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar números com separadores
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Formatar porcentagem
  const formatPercent = (value: number) => {
    return `${value.toFixed(1).replace('.', ',')}%`;
  };
  
  return (
    <div ref={dashboardRef} className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center">
          <ChevronLeft 
            className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
            onClick={() => window.history.back()}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise de Vendas</h1>
            <p className="text-gray-500">Dashboard analítico com métricas e tendências</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de período */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${period === 'today' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setPeriod('today')}
            >
              Hoje
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${period === 'week' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setPeriod('week')}
            >
              Semana
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${period === 'month' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setPeriod('month')}
            >
              Mês
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${period === 'quarter' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setPeriod('quarter')}
            >
              Trimestre
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${period === 'year' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setPeriod('year')}
            >
              Ano
            </button>
          </div>
          
          {/* Botões de ação */}
          <button 
            className="btn-outline"
            onClick={() => setShowReportModal(true)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button 
            className="btn-outline"
            onClick={() => setShowAlertModal(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </button>
          <button 
            className="btn-outline"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>
      
      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <div dangerouslySetInnerHTML={{ __html: success }} />
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <X className="h-5 w-5 text-green-500" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Carregando dados do dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
              <div 
                key={metric.id} 
                className="card animate-slide-up" 
                style={{ animationDelay: `${metrics.indexOf(metric) * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                      {metric.unit === 'BRL' 
                        ? formatCurrency(metric.value) 
                        : formatNumber(metric.value)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: metric.status === 'success' ? 'rgba(16, 185, 129, 0.1)' 
                        : metric.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' 
                        : metric.status === 'danger' ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)' 
                    }}
                  >
                    {metric.id === 'total_sales' && <DollarSign className="h-6 w-6 text-green-600" />}
                    {metric.id === 'average_ticket' && <ShoppingCart className="h-6 w-6 text-blue-600" />}
                    {metric.id === 'sale_count' && <BarChart2 className="h-6 w-6 text-purple-600" />}
                    {metric.id === 'customer_count' && <Users className="h-6 w-6 text-orange-500" />}
                  </div>
                </div>
                {metric.trend !== undefined && (
                  <div className="flex items-center mt-4">
                    <div className={`flex items-center ${
                      metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {metric.trend > 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : metric.trend < 0 ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : (
                        <div className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">{formatPercent(Math.abs(metric.trend))}</span>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">vs. período anterior</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Day Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Dia</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts.find(c => c.id === 'sales_by_day')?.data || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickFormatter={(value) => `R$${value/1000}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                      labelFormatter={(label) => `Data: ${label}`}
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Vendas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
              <div className="h-80 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.find(c => c.id === 'sales_by_category')?.data || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(charts.find(c => c.id === 'sales_by_category')?.data || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Percentual']}
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Additional Data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">{formatNumber(product.quantity)} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(product.total)}</span>
                      <div className="text-xs text-gray-500">{formatPercent(product.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes Mais Importantes</h3>
              <div className="space-y-3">
                {topCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{customer.name}</h4>
                      <p className="text-sm text-gray-500">{customer.purchases} compras</p>
                      <p className="text-xs text-gray-500">Última: {customer.lastPurchase}</p>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(customer.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{sale.customer}</h4>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{sale.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{formatCurrency(sale.total)}</span>
                        <div className="text-xs text-gray-500">{sale.items} itens</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Exportar Relatório */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Exportar Relatório</h3>
              <button onClick={() => setShowReportModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                      <input
                        type="date"
                        className="input w-full"
                        value={reportParams.startDate}
                        onChange={(e) => setReportParams({...reportParams, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                      <input
                        type="date"
                        className="input w-full"
                        value={reportParams.endDate}
                        onChange={(e) => setReportParams({...reportParams, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agrupar Por
                  </label>
                  <select
                    className="input w-full"
                    value={reportParams.groupBy}
                    onChange={(e) => setReportParams({...reportParams, groupBy: e.target.value as any})}
                  >
                    <option value="day">Dia</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                    <option value="quarter">Trimestre</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato
                  </label>
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 p-2 border rounded-md flex flex-col items-center justify-center hover:bg-gray-50"
                      onClick={() => generateReport()}
                    >
                      <FileText className="h-6 w-6 text-gray-500 mb-1" />
                      <span className="text-sm">PDF</span>
                    </button>
                    <button 
                      className="flex-1 p-2 border rounded-md flex flex-col items-center justify-center hover:bg-gray-50"
                      onClick={() => generateReport()}
                    >
                      <FileText className="h-6 w-6 text-green-500 mb-1" />
                      <span className="text-sm">Excel</span>
                    </button>
                    <button 
                      className="flex-1 p-2 border rounded-md flex flex-col items-center justify-center hover:bg-gray-50"
                      onClick={() => generateReport()}
                    >
                      <FileText className="h-6 w-6 text-blue-500 mb-1" />
                      <span className="text-sm">CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                className="btn-outline mr-3"
                onClick={() => setShowReportModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={generateReport}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Configurar Alerta */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Configurar Alerta</h3>
              <button onClick={() => setShowAlertModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Métrica
                  </label>
                  <select
                    className="input w-full"
                    value={alertConfig.metricId}
                    onChange={(e) => setAlertConfig({...alertConfig, metricId: e.target.value})}
                  >
                    <option value="">Selecione uma métrica</option>
                    <option value="daily_sales">Vendas diárias</option>
                    <option value="avg_ticket">Ticket médio</option>
                    <option value="out_of_stock">Produtos sem estoque</option>
                    <option value="refund_rate">Taxa de devoluções</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condição
                  </label>
                  <div className="flex space-x-3">
                    <select
                      className="input w-1/3"
                      value={alertConfig.condition}
                      onChange={(e) => setAlertConfig({...alertConfig, condition: e.target.value as any})}
                    >
                      <option value="lt">Menor que</option>
                      <option value="lte">Menor ou igual</option>
                      <option value="gt">Maior que</option>
                      <option value="gte">Maior ou igual</option>
                      <option value="eq">Igual a</option>
                    </select>
                    
                    <input
                      type="number"
                      className="input w-2/3"
                      placeholder="Valor limite"
                      value={alertConfig.value}
                      onChange={(e) => setAlertConfig({...alertConfig, value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canais de Notificação
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 mr-2"
                        checked={alertConfig.channels.includes('email')}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          channels: e.target.checked 
                            ? [...alertConfig.channels, 'email'] 
                            : alertConfig.channels.filter(c => c !== 'email')
                        })}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 mr-2"
                        checked={alertConfig.channels.includes('system')}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          channels: e.target.checked 
                            ? [...alertConfig.channels, 'system'] 
                            : alertConfig.channels.filter(c => c !== 'system')
                        })}
                      />
                      <span className="text-sm">Sistema</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatários (Email)
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    placeholder="email@exemplo.com"
                    value={alertConfig.recipients[0] || ''}
                    onChange={(e) => setAlertConfig({...alertConfig, recipients: [e.target.value]})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem do Alerta
                  </label>
                  <textarea
                    className="input w-full"
                    placeholder="Descreva o alerta..."
                    rows={3}
                    value={alertConfig.message}
                    onChange={(e) => setAlertConfig({...alertConfig, message: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                className="btn-outline mr-3"
                onClick={() => setShowAlertModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={configureAlert}
                disabled={isLoading}
              >
                <Bell className="h-4 w-4 mr-2" />
                Criar Alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAnalytics;