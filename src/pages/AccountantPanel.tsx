import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart2, 
  Calculator, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Eye, 
  Settings, 
  PanelLeft, 
  PanelRight, 
  Users,
  DollarSign,
  Plus 
} from 'lucide-react';
import { fiscalService } from '../services/fiscalService';
import FiscalDocumentWidget from '../components/FiscalDocumentWidget';

/**
 * Dashboard centralizado para contadores com integração de Notas Fiscais, 
 * Gestão de Impostos e Controle de Alíquotas
 */
const AccountantPanel: React.FC = () => {
  // Estados para gerenciar a interface e os dados
  const [activeTab, setActiveTab] = useState<'nfe' | 'taxes' | 'rates' | 'reports'>('nfe');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, type: string, message: string, date: Date}>>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Buscar os dados ao carregar o componente
  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [activeTab, dateRange]);

  // Função para buscar os dados de acordo com a aba ativa
  const fetchData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'nfe':
          // Dados simulados para as notas fiscais eletrônicas
          setInvoices([
            { id: '001', number: 'NFe-78565', date: new Date(2024, 3, 15), type: 'saída', status: 'autorizada', value: 12560.75, issuer: 'Empresa ABC Ltda', recipient: 'XYZ Comércio', taxTotal: 2267.94 },
            { id: '002', number: 'NFe-78566', date: new Date(2024, 3, 15), type: 'saída', status: 'autorizada', value: 3450.50, issuer: 'Empresa ABC Ltda', recipient: 'Loja 123', taxTotal: 621.09 },
            { id: '003', number: 'NFe-78567', date: new Date(2024, 3, 16), type: 'saída', status: 'autorizada', value: 7800.25, issuer: 'Empresa ABC Ltda', recipient: 'Distribuidora Central', taxTotal: 1404.05 },
            { id: '004', number: 'NFe-10322', date: new Date(2024, 3, 12), type: 'entrada', status: 'autorizada', value: 15670.90, issuer: 'Fornecedor XYZ', recipient: 'Empresa ABC Ltda', taxTotal: 2820.76 },
            { id: '005', number: 'NFe-10323', date: new Date(2024, 3, 13), type: 'entrada', status: 'autorizada', value: 9540.30, issuer: 'Fornecedor QWE', recipient: 'Empresa ABC Ltda', taxTotal: 1717.25 },
            { id: '006', number: 'NFe-78568', date: new Date(2024, 3, 17), type: 'saída', status: 'rejeitada', value: 2340.60, issuer: 'Empresa ABC Ltda', recipient: 'Cliente Final', taxTotal: 421.31, rejectReason: 'Valor total difere do cálculo dos itens' },
          ]);
          break;
        case 'taxes':
          // Dados simulados para a gestão de impostos
          setTaxData([
            { id: '001', type: 'ICMS', period: 'Abril/2024', base: 145780.50, rate: 18, amount: 26240.49, status: 'pendente', dueDate: new Date(2024, 4, 20) },
            { id: '002', type: 'IPI', period: 'Abril/2024', base: 87450.30, rate: 10, amount: 8745.03, status: 'pendente', dueDate: new Date(2024, 4, 25) },
            { id: '003', type: 'PIS', period: 'Abril/2024', base: 145780.50, rate: 0.65, amount: 947.57, status: 'pendente', dueDate: new Date(2024, 4, 25) },
            { id: '004', type: 'COFINS', period: 'Abril/2024', base: 145780.50, rate: 3, amount: 4373.42, status: 'pendente', dueDate: new Date(2024, 4, 25) },
            { id: '005', type: 'ISS', period: 'Abril/2024', base: 23450.75, rate: 5, amount: 1172.54, status: 'pendente', dueDate: new Date(2024, 4, 15) },
            { id: '006', type: 'ICMS', period: 'Março/2024', base: 135670.40, rate: 18, amount: 24420.67, status: 'pago', dueDate: new Date(2024, 3, 20) },
          ]);
          break;
        case 'rates':
          // Dados simulados para o controle de alíquotas
          setRates([
            { id: '001', type: 'ICMS', description: 'Operações internas', state: 'SP', rate: 18, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '002', type: 'ICMS', description: 'Operações interestaduais - Região Sul/Sudeste', states: ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'], rate: 12, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '003', type: 'ICMS', description: 'Operações interestaduais - Outras regiões', states: ['Demais estados'], rate: 7, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '004', type: 'ISS', description: 'Serviços em geral', municipality: 'São Paulo - SP', rate: 5, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '005', type: 'PIS', description: 'Regime não-cumulativo', rate: 1.65, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '006', type: 'COFINS', description: 'Regime não-cumulativo', rate: 7.6, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '007', type: 'IPI', description: 'Produtos alimentícios', rate: 0, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
            { id: '008', type: 'ICMS-ST', description: 'Substituição tributária - Autopeças', state: 'SP', rate: 18, margin: 40, effectiveDate: new Date(2023, 0, 1), status: 'vigente' },
          ]);
          break;
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para buscar as notificações
  const fetchNotifications = async () => {
    // Notificações simuladas
    setNotifications([
      { id: '001', type: 'alert', message: 'Prazo de envio da EFD-ICMS/IPI se encerra em 3 dias', date: new Date(2024, 3, 18) },
      { id: '002', type: 'error', message: 'Inconsistência detectada na NF-e 78568: valor total dos itens não confere', date: new Date(2024, 3, 17) },
      { id: '003', type: 'warning', message: 'Alíquota de ISS aplicada diferente da configurada para o município', date: new Date(2024, 3, 16) },
      { id: '004', type: 'info', message: 'Backup automático dos documentos fiscais concluído com sucesso', date: new Date(2024, 3, 15) },
    ]);
  };
  
  // Alternar a expansão de um item
  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Renderizar o cabeçalho da página
  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel do Contador</h1>
        <p className="text-gray-500">Gestão centralizada de documentos fiscais e tributação</p>
      </div>
      <div className="flex space-x-3">
        <button className="btn-outline" onClick={() => setShowSidebar(!showSidebar)}>
          {showSidebar ? <PanelRight className="h-4 w-4 mr-2" /> : <PanelLeft className="h-4 w-4 mr-2" />}
          {showSidebar ? 'Ocultar Painel' : 'Mostrar Painel'}
        </button>
        <button className="btn-primary">
          <Download className="h-4 w-4 mr-2" />
          Exportar Dados
        </button>
      </div>
    </div>
  );

  // Renderizar a navegação entre abas
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8" aria-label="Tabs">
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'nfe'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('nfe')}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Notas Fiscais
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'taxes'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('taxes')}
        >
          <DollarSign className="h-4 w-4 inline mr-2" />
          Gestão de Impostos
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'rates'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('rates')}
        >
          <Calculator className="h-4 w-4 inline mr-2" />
          Controle de Alíquotas
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'reports'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart2 className="h-4 w-4 inline mr-2" />
          Relatórios
        </button>
      </nav>
    </div>
  );

  // Renderizar a barra de filtros
  const renderFilterBar = () => (
    <div className="flex flex-col md:flex-row mb-6 space-y-4 md:space-y-0 md:space-x-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="input pl-10 w-full"
          placeholder={`Buscar ${activeTab === 'nfe' ? 'notas fiscais' : activeTab === 'taxes' ? 'impostos' : 'alíquotas'}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex space-x-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'today' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setDateRange('today')}
          >
            Hoje
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'week' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setDateRange('week')}
          >
            Semana
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'month' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setDateRange('month')}
          >
            Mês
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium ${dateRange === 'year' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setDateRange('year')}
          >
            Ano
          </button>
        </div>
        <button 
          className="btn-outline py-2" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
        <div className="flex space-x-1 border rounded-md">
          <button
            className={`px-2 py-1 ${viewMode === 'cards' ? 'bg-primary/5 text-primary' : 'text-gray-500'}`}
            onClick={() => setViewMode('cards')}
          >
            <div className="h-5 w-5 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <div className={`border ${viewMode === 'cards' ? 'border-primary' : 'border-gray-400'} rounded-sm`}></div>
                <div className={`border ${viewMode === 'cards' ? 'border-primary' : 'border-gray-400'} rounded-sm`}></div>
                <div className={`border ${viewMode === 'cards' ? 'border-primary' : 'border-gray-400'} rounded-sm`}></div>
                <div className={`border ${viewMode === 'cards' ? 'border-primary' : 'border-gray-400'} rounded-sm`}></div>
              </div>
            </div>
          </button>
          <button
            className={`px-2 py-1 ${viewMode === 'table' ? 'bg-primary/5 text-primary' : 'text-gray-500'}`}
            onClick={() => setViewMode('table')}
          >
            <div className="h-5 w-5 flex flex-col items-center justify-center gap-0.5">
              <div className={`h-0.5 w-3.5 ${viewMode === 'table' ? 'bg-primary' : 'bg-gray-400'} rounded-full`}></div>
              <div className={`h-0.5 w-3.5 ${viewMode === 'table' ? 'bg-primary' : 'bg-gray-400'} rounded-full`}></div>
              <div className={`h-0.5 w-3.5 ${viewMode === 'table' ? 'bg-primary' : 'bg-gray-400'} rounded-full`}></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar filtros avançados
  const renderAdvancedFilters = () => (
    showFilters && (
      <div className="bg-gray-50 p-4 rounded-lg mb-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Filtros Avançados</h3>
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setShowFilters(false)}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTab === 'nfe' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="nfe">NF-e</option>
                  <option value="nfce">NFC-e</option>
                  <option value="cte">CT-e</option>
                  <option value="nfse">NFS-e</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="authorized">Autorizadas</option>
                  <option value="rejected">Rejeitadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="pending">Pendentes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operação
                </label>
                <select className="input w-full">
                  <option value="all">Todas</option>
                  <option value="in">Entrada</option>
                  <option value="out">Saída</option>
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'taxes' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Imposto
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="icms">ICMS</option>
                  <option value="ipi">IPI</option>
                  <option value="pis">PIS</option>
                  <option value="cofins">COFINS</option>
                  <option value="iss">ISS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período de Apuração
                </label>
                <select className="input w-full">
                  <option value="april2024">Abril/2024</option>
                  <option value="march2024">Março/2024</option>
                  <option value="february2024">Fevereiro/2024</option>
                  <option value="january2024">Janeiro/2024</option>
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'rates' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Tributo
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="icms">ICMS</option>
                  <option value="iss">ISS</option>
                  <option value="pis">PIS</option>
                  <option value="cofins">COFINS</option>
                  <option value="ipi">IPI</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado/Município
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="sp">São Paulo</option>
                  <option value="rj">Rio de Janeiro</option>
                  <option value="mg">Minas Gerais</option>
                  <option value="es">Espírito Santo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="input w-full">
                  <option value="all">Todos</option>
                  <option value="active">Vigente</option>
                  <option value="upcoming">Futura</option>
                  <option value="expired">Expirada</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button className="btn-outline mr-2">Limpar Filtros</button>
          <button className="btn-primary">Aplicar Filtros</button>
        </div>
      </div>
    )
  );
  
  // Renderizar estatísticas resumidas
  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {activeTab === 'nfe' && (
        <>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Notas Emitidas (Mês)</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">158</p>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Valor Total (Mês)</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">R$ 243.780,55</p>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8,5%</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Rejeitadas (Mês)</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">3</p>
              <div className="flex items-center text-green-600">
                <TrendingDownIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">-25%</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Impostos Apurados</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">R$ 43.880,50</p>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+7,2%</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'taxes' && (
        <>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">ICMS a Recolher</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">R$ 26.240,49</p>
              <div className="flex items-center text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">20/05/24</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">PIS/COFINS a Recolher</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">R$ 5.320,99</p>
              <div className="flex items-center text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">25/05/24</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Economia Tributária</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">R$ 12.450,80</p>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+15%</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Regularidade Fiscal</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-green-600">Regular</p>
              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Todas CND's válidas</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'rates' && (
        <>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Alíquotas Cadastradas</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">42</p>
              <div className="flex items-center text-blue-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+2</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Modificadas (30 dias)</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">5</p>
              <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Revisar mudanças</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Próximas Alterações</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">2</p>
              <div className="flex items-center text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">01/06/24</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Conflitos Detectados</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-amber-600">1</p>
              <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Verificar</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Relatórios Disponíveis</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">12</p>
              <div className="text-primary text-sm">
                <a href="#" className="hover:underline">Ver todos</a>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Relatórios Gerados (Mês)</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">8</p>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+3</span>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Últimos Relatórios</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">Ontem</p>
              <div className="text-primary text-sm">
                <a href="#" className="hover:underline">Visualizar</a>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500">Relatórios Agendados</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-2xl font-semibold text-gray-900">3</p>
              <div className="text-primary text-sm">
                <a href="#" className="hover:underline">Gerenciar</a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  // Renderizar o conteúdo principal do dashboard
  const renderContent = () => (
    <div className={`grid ${showSidebar ? 'grid-cols-1 lg:grid-cols-3 gap-6' : 'grid-cols-1'}`}>
      {/* Conteúdo principal */}
      <div className={showSidebar ? 'lg:col-span-2' : 'col-span-1'}>
        {/* Renderiza o componente apropriado de acordo com a aba ativa */}
        {activeTab === 'nfe' && renderNfeContent()}
        {activeTab === 'taxes' && renderTaxesContent()}
        {activeTab === 'rates' && renderRatesContent()}
        {activeTab === 'reports' && renderReportsContent()}
      </div>
      
      {/* Painel lateral */}
      {showSidebar && (
        <div className="lg:col-span-1 space-y-6">
          {renderSidebar()}
        </div>
      )}
    </div>
  );
  
  // Renderizar conteúdo da aba de Notas Fiscais
  const renderNfeContent = () => (
    <div className="space-y-6">
      {/* Gráfico de NFes por período */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fluxo de NFe</h3>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${chartPeriod === 'day' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setChartPeriod('day')}
            >
              Diário
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${chartPeriod === 'month' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setChartPeriod('month')}
            >
              Mensal
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium ${chartPeriod === 'year' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setChartPeriod('year')}
            >
              Anual
            </button>
          </div>
        </div>
        
        <div className="h-64 relative">
          {/* Este seria o local para um gráfico real usando Recharts ou similar */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-center">
              <BarChart2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Gráfico de Fluxo de NFe por {chartPeriod === 'day' ? 'Dia' : chartPeriod === 'month' ? 'Mês' : 'Ano'}</p>
              <p className="text-sm text-gray-500">Em um ambiente de produção, este seria um gráfico interativo</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de Notas Fiscais */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map(invoice => (
            <div 
              key={invoice.id} 
              className={`border rounded-lg overflow-hidden transition-all ${
                invoice.status === 'rejeitada' ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              <div className={`p-4 ${invoice.status === 'rejeitada' ? 'bg-red-50' : 'bg-white'}`}>
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{invoice.number}</h3>
                    <p className="text-sm text-gray-600">
                      {invoice.type === 'entrada' ? 'Recebida de:' : 'Emitida para:'} {invoice.type === 'entrada' ? invoice.issuer : invoice.recipient}
                    </p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{formatDate(invoice.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'autorizada' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'rejeitada' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status === 'autorizada' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {invoice.status === 'rejeitada' && <XCircle className="h-3 w-3 mr-1" />}
                      {invoice.status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <span className="text-lg font-bold mt-2">{formatCurrency(invoice.value)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div>
                    <span className="text-sm font-medium">Impostos:</span>
                    <span className="text-sm ml-1">{formatCurrency(invoice.taxTotal)}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1.5 text-gray-500 hover:text-primary rounded-full">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-primary rounded-full">
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-primary rounded-full"
                      onClick={() => toggleItemExpansion(invoice.id)}
                    >
                      {expandedItems.includes(invoice.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Detalhes expandidos */}
                {expandedItems.includes(invoice.id) && (
                  <div className="mt-3 pt-3 border-t animate-slide-up">
                    {invoice.status === 'rejeitada' && (
                      <div className="mb-3 flex items-start bg-red-50 p-3 rounded-md">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Motivo da Rejeição:</p>
                          <p className="text-sm text-red-700">{invoice.rejectReason}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Chave de Acesso:</p>
                        <p className="font-mono text-xs">31220501234567890123455001000000012345678901</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Protocolo:</p>
                        <p>123456789012345</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CFOP:</p>
                        <p>{invoice.type === 'entrada' ? '2.102' : '5.102'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de Autorização:</p>
                        <p>{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <button className="btn-outline text-sm py-1">Detalhes Completos</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {invoice => invoice.type === 'entrada' ? 'Fornecedor' : 'Cliente'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operação</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className={invoice.status === 'rejeitada' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.type === 'entrada' ? invoice.issuer : invoice.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.type === 'entrada' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {invoice.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(invoice.value)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'autorizada' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'rejeitada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status === 'autorizada' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {invoice.status === 'rejeitada' && <XCircle className="h-3 w-3 mr-1" />}
                        {invoice.status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-primary rounded"
                          onClick={() => toggleItemExpansion(invoice.id)}
                        >
                          {expandedItems.includes(invoice.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  
  // Renderizar conteúdo da aba de Gestão de Impostos
  const renderTaxesContent = () => (
    <div className="space-y-6">
      {/* Resumo de impostos */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Resumo de Impostos por Período</h3>
        
        <div className="h-64 relative">
          {/* Este seria o local para um gráfico real usando Recharts ou similar */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-center">
              <BarChart2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Gráfico de Impostos por Período</p>
              <p className="text-sm text-gray-500">Em um ambiente de produção, este seria um gráfico interativo</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de impostos */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taxData.map(tax => (
            <div 
              key={tax.id} 
              className="border rounded-lg overflow-hidden transition-all"
            >
              <div className="p-4 bg-white">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{tax.type}</h3>
                    <p className="text-sm text-gray-600">
                      Período de apuração: {tax.period}
                    </p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">Vencimento: {formatDate(tax.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tax.status === 'pago' ? 'bg-green-100 text-green-800' :
                      tax.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tax.status === 'pago' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {tax.status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                      {tax.status === 'atrasado' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {tax.status.charAt(0).toUpperCase() + tax.status.slice(1)}
                    </span>
                    <span className="text-lg font-bold mt-2">{formatCurrency(tax.amount)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Base de cálculo:</span>
                      <span className="ml-1 font-medium">{formatCurrency(tax.base)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Alíquota:</span>
                      <span className="ml-1 font-medium">{tax.rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <button 
                    className="p-1.5 text-gray-500 hover:text-primary rounded-full"
                    onClick={() => toggleItemExpansion(tax.id)}
                  >
                    {expandedItems.includes(tax.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Detalhes expandidos */}
                {expandedItems.includes(tax.id) && (
                  <div className="mt-3 pt-3 border-t animate-slide-up">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Forma de apuração:</p>
                          <p>Regime não-cumulativo</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Código de recolhimento:</p>
                          <p>1107</p>
                        </div>
                      </div>
                      
                      {tax.status === 'pendente' && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="flex items-start">
                            <Calendar className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Prazo para pagamento</p>
                              <p className="text-sm text-blue-700">O imposto deve ser pago até {formatDate(tax.dueDate)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <button className="btn-outline text-sm py-1 px-3">
                          <Download className="h-3.5 w-3.5 mr-1.5 inline" />
                          DARF
                        </button>
                        <button className="btn-primary text-sm py-1 px-3">
                          <Eye className="h-3.5 w-3.5 mr-1.5 inline" />
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tributo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alíquota</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxData.map((tax) => (
                  <tr key={tax.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tax.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(tax.base)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax.rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(tax.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tax.dueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tax.status === 'pago' ? 'bg-green-100 text-green-800' :
                        tax.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tax.status === 'pago' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {tax.status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                        {tax.status === 'atrasado' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {tax.status.charAt(0).toUpperCase() + tax.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-primary rounded"
                          onClick={() => toggleItemExpansion(tax.id)}
                        >
                          {expandedItems.includes(tax.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  
  // Renderizar conteúdo da aba de Controle de Alíquotas
  const renderRatesContent = () => (
    <div className="space-y-6">
      {/* Tabs para categorias de alíquotas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide">
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-primary text-primary"
          >
            Todos
          </button>
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            ICMS
          </button>
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            ISS
          </button>
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            PIS/COFINS
          </button>
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            IPI
          </button>
          <button
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            ST
          </button>
        </nav>
      </div>
      
      {/* Lista de alíquotas */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rates.map(rate => (
            <div 
              key={rate.id} 
              className="border rounded-lg overflow-hidden transition-all"
            >
              <div className="p-4 bg-white">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium mr-2">
                        {rate.type}
                      </span>
                      <h3 className="text-lg font-medium">{rate.description}</h3>
                    </div>
                    <div className="mt-1">
                      {rate.state && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-1">Estado:</span> 
                          <span>{rate.state}</span>
                        </div>
                      )}
                      {rate.states && (
                        <div className="flex items-start text-sm text-gray-600">
                          <span className="font-medium mr-1">Estados:</span>
                          <span className="text-sm">{rate.states.join(', ')}</span>
                        </div>
                      )}
                      {rate.municipality && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-1">Município:</span>
                          <span>{rate.municipality}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rate.status === 'vigente' ? 'bg-green-100 text-green-800' :
                        rate.status === 'futura' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rate.status === 'vigente' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {rate.status === 'futura' && <Calendar className="h-3 w-3 mr-1" />}
                        {rate.status === 'expirada' && <XCircle className="h-3 w-3 mr-1" />}
                        {rate.status.charAt(0).toUpperCase() + rate.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-baseline mt-2">
                      <span className="text-2xl font-bold">{rate.rate}%</span>
                      {rate.margin && (
                        <span className="ml-1 text-sm text-gray-500">+ MVA {rate.margin}%</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">
                        Vigente desde: {formatDate(rate.effectiveDate)}
                      </span>
                    </div>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-primary rounded-full"
                      onClick={() => toggleItemExpansion(rate.id)}
                    >
                      {expandedItems.includes(rate.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Detalhes expandidos */}
                {expandedItems.includes(rate.id) && (
                  <div className="mt-3 pt-3 border-t animate-slide-up">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Fundamento legal:</p>
                          <p>Resolução CONFAZ nº 123/2023</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CEST (se aplicável):</p>
                          <p>{rate.type === 'ICMS-ST' ? '01.123.45' : '-'}</p>
                        </div>
                      </div>
                      
                      {rate.type === 'ICMS-ST' && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="flex items-start">
                            <Calculator className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Cálculo da ST</p>
                              <p className="text-sm text-blue-700">
                                Base = Valor Produto × (1 + {rate.margin}%)
                              </p>
                              <p className="text-sm text-blue-700">
                                ICMS-ST = Base × {rate.rate}% − ICMS Próprio
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <button className="btn-outline text-sm py-1 px-3">
                          <Download className="h-3.5 w-3.5 mr-1.5 inline" />
                          Exportar
                        </button>
                        <button className="btn-primary text-sm py-1 px-3">
                          <Eye className="h-3.5 w-3.5 mr-1.5 inline" />
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alíquota</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigência</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-medium">
                        {rate.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.state || rate.states?.join(', ') || rate.municipality || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">{rate.rate}%</span>
                      {rate.margin && (
                        <span className="text-xs text-gray-500 ml-1">+ MVA {rate.margin}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(rate.effectiveDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rate.status === 'vigente' ? 'bg-green-100 text-green-800' :
                        rate.status === 'futura' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rate.status === 'vigente' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {rate.status === 'futura' && <Calendar className="h-3 w-3 mr-1" />}
                        {rate.status === 'expirada' && <XCircle className="h-3 w-3 mr-1" />}
                        {rate.status.charAt(0).toUpperCase() + rate.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-primary rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-primary rounded"
                          onClick={() => toggleItemExpansion(rate.id)}
                        >
                          {expandedItems.includes(rate.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  
  // Renderizar conteúdo da aba de Relatórios
  const renderReportsContent = () => (
    <div className="space-y-6">
      {/* Categorias de relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Relatórios Fiscais</h3>
              <p className="text-gray-600 text-sm mt-1">Relatórios como SPED, DCTF, EFD-Reinf, etc.</p>
              <p className="text-primary text-sm font-medium mt-2">6 relatórios disponíveis</p>
            </div>
          </div>
        </div>
        
        <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
              <BarChart2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Relatórios Gerenciais</h3>
              <p className="text-gray-600 text-sm mt-1">Dashboard, análises e gráficos interativos</p>
              <p className="text-primary text-sm font-medium mt-2">4 relatórios disponíveis</p>
            </div>
          </div>
        </div>
        
        <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Relatórios Tributários</h3>
              <p className="text-gray-600 text-sm mt-1">Apuração de impostos e regimes tributários</p>
              <p className="text-primary text-sm font-medium mt-2">5 relatórios disponíveis</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de relatórios recentes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Relatórios Recentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relatório</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerado em</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SPED Fiscal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Março/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/04/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.txt</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Apuração ICMS</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Março/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10/04/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.xlsx</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dashboard Fiscal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1º Trim/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">05/04/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.pdf</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EFD-Reinf</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Março/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12/04/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.xml</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Relatórios agendados */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Relatórios Agendados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relatório</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Execução</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Relatório de Vendas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Diário</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Amanhã, 07:00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.xlsx</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Resumo Fiscal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Semanal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Segunda, 08:00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.pdf</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Apuração de Impostos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mensal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">01/05/2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.xlsx</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary py-2 px-4">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderizar o painel lateral
  const renderSidebar = () => (
    <>
      {/* Status do sistema fiscal */}
      <FiscalDocumentWidget />
      
      {/* Notificações */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          Alertas e Notificações
        </h3>
        
        <div className="space-y-3">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-3 rounded-lg border ${
                notification.type === 'alert' ? 'bg-amber-50 border-amber-200' :
                notification.type === 'error' ? 'bg-red-50 border-red-200' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start">
                {notification.type === 'alert' && <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />}
                {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />}
                {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />}
                {notification.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />}
                <div>
                  <p className={`text-sm ${
                    notification.type === 'alert' ? 'text-amber-800' :
                    notification.type === 'error' ? 'text-red-800' :
                    notification.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notification.date)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-center">
          <a href="#" className="text-primary text-sm hover:text-primary-dark">
            Ver todas as notificações
          </a>
        </div>
      </div>
      
      {/* Calendário fiscal */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Calendário Fiscal
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Hoje</p>
                <p className="text-sm text-red-700">Vencimento: ISS Abril/2024</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Em 5 dias</p>
                <p className="text-sm text-amber-700">Vencimento: ICMS Abril/2024</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg border border-gray-200">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Em 10 dias</p>
                <p className="text-sm text-gray-700">Vencimento: PIS/COFINS Abril/2024</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <a href="#" className="text-primary text-sm hover:text-primary-dark">
            Ver calendário completo
          </a>
        </div>
      </div>
      
      {/* Dashboard Configurável */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900">Personalização</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Painéis customizados</span>
            <button className="text-primary text-sm hover:text-primary-dark">Gerenciar</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Alertas automáticos</span>
            <button className="text-primary text-sm hover:text-primary-dark">Configurar</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Formatos de exportação</span>
            <button className="text-primary text-sm hover:text-primary-dark">Definir</button>
          </div>
        </div>
      </div>
    </>
  );
  
  // Componente principal
  return (
    <div className="space-y-6 animate-fade-in">
      {renderHeader()}
      {renderTabs()}
      {renderFilterBar()}
      {renderAdvancedFilters()}
      {renderStats()}
      {renderContent()}
    </div>
  );
};

// Componentes auxiliares
const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TrendingDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

export default AccountantPanel;