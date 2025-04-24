import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart2, 
  ChevronLeft, 
  Download, 
  FileUp, 
  ScanLine,
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  Bell,
  ExternalLink,
  PieChart,
  TrendingUp,
  Filter,
  Calendar,
  FileText,
  Clock,
  Upload,
  X,
  Search,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { salesAnalyticsService } from '../../services/salesAnalyticsService';
import { documentImportService } from '../../services/documentImportService';
import { ocrService } from '../../services/ocrService';
import { toast } from 'react-toastify';

/**
 * Central dashboard para automação e integração do módulo de vendas
 */
const AutomationHub: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [salesMetrics, setSalesMetrics] = useState<any[]>([]);
  const [recentImports, setRecentImports] = useState<any[]>([]);
  const [recentOcrDocuments, setRecentOcrDocuments] = useState<any[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<any[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [alertForm, setAlertForm] = useState({
    metricId: '',
    condition: 'lt',
    value: 0,
    message: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [period, reloadTrigger]);
  
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load sales metrics
      const metricsData = await salesAnalyticsService.getSalesMetrics(period);
      setSalesMetrics(metricsData || []);
      
      // Load recent document imports
      const importsData = await documentImportService.getImportedDocuments({
        limit: 5
      });
      setRecentImports(importsData || []);
      
      // Load recent OCR documents
      const ocrData = await ocrService.getProcessedDocuments({
        limit: 5
      });
      setRecentOcrDocuments(ocrData || []);
      
      // Load alert configurations
      const alertsData = await salesAnalyticsService.getAlertConfigurations();
      setAlertConfigs(alertsData || []);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      if (files.length === 1) {
        // Single file upload
        await documentImportService.importXmlFile(files[0]);
        toast.success(`Documento "${files[0].name}" importado com sucesso`);
      } else {
        // Multiple files upload
        const result = await documentImportService.importMultipleXmlFiles(Array.from(files));
        toast.success(`Importação concluída: ${result.success} sucesso, ${result.failed} falhas`);
      }
      
      // Refresh data
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Erro ao importar documentos");
    } finally {
      setIsLoading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    try {
      // Process the first file with OCR
      const result = await ocrService.processDocument(files[0], 'receipt');
      
      if (result.success) {
        toast.success("Documento enviado para processamento OCR");
      } else {
        throw new Error(result.message || "Erro ao processar documento");
      }
      
      // Refresh data
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error processing OCR document:", error);
      toast.error("Erro ao processar documento OCR");
    } finally {
      setIsLoading(false);
      // Clear the input
      if (ocrFileInputRef.current) {
        ocrFileInputRef.current.value = '';
      }
    }
  };
  
  const handleCreateAlert = async () => {
    if (!alertForm.metricId || !alertForm.message) {
      toast.warning("Preencha todos os campos do alerta");
      return;
    }
    
    setIsLoading(true);
    try {
      const alertId = await salesAnalyticsService.configureAlert({
        ...alertForm,
        channels: ['email', 'system'],
        recipients: ['admin@example.com'],
        active: true
      });
      
      toast.success("Alerta configurado com sucesso");
      setShowAlertModal(false);
      
      // Reset form and refresh data
      setAlertForm({
        metricId: '',
        condition: 'lt',
        value: 0,
        message: ''
      });
      
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Erro ao configurar alerta");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge for imports
  const getImportStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processando
          </span>
        );
      case 'validated':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validado
          </span>
        );
      case 'imported':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Importado
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erro
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  // Get status badge for OCR documents
  const getOcrStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erro
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center">
          <ChevronLeft 
            className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
            onClick={() => window.history.back()}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Automação</h1>
            <p className="text-gray-500">Integração e automação de processos de vendas</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
          </div>
          
          <button
            className="btn-outline"
            onClick={() => setReloadTrigger(prev => prev + 1)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          
          <button
            className="btn-outline"
            onClick={() => setShowAlertModal(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </button>
        </div>
      </div>

      {/* Main content - Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Analytics */}
        <Link to="/sales/analytics" className="card hover:shadow-md transition-shadow p-6 border-2 border-primary/5">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BarChart2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Análise de Vendas</h3>
          <p className="text-gray-600 mb-4">
            Dashboard analítico com KPIs, gráficos, relatórios e alertas automáticos para monitoramento de métricas críticas.
          </p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">Atualizados há {Math.floor(Math.random() * 30) + 1}min</span>
            <div className="text-primary flex items-center">
              Ver dashboard
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </Link>
        
        {/* Document Import */}
        <Link to="/sales/document-importer" className="card hover:shadow-md transition-shadow p-6 border-2 border-primary/5">
          <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <FileUp className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Importação de XML/NFe</h3>
          <p className="text-gray-600 mb-4">
            Importe e valide documentos fiscais, atualize estoque e registre contas a pagar automaticamente.
          </p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">{recentImports.length} docs. recentes</span>
            <div className="text-primary flex items-center">
              Importar documentos
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </Link>
        
        {/* OCR Processing */}
        <Link to="/sales/ocr-processor" className="card hover:shadow-md transition-shadow p-6 border-2 border-primary/5">
          <div className="h-14 w-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <ScanLine className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Processamento OCR</h3>
          <p className="text-gray-600 mb-4">
            Extraia dados de notas, recibos e faturas em formato PDF ou imagem com reconhecimento automático.
          </p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">{recentOcrDocuments.length} docs. processados</span>
            <div className="text-primary flex items-center">
              Processar documentos
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </Link>
      </div>
      
      {/* Quick Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Upload Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/60 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <FileUp className="h-10 w-10 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-1">Arraste XMLs de NFe aqui</p>
                <p className="text-xs text-gray-500">ou clique para selecionar</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xml"
                  multiple
                  onChange={handleDocumentUpload}
                />
              </div>
              <button className="w-full mt-2 btn-primary py-2">
                <FileUp className="h-4 w-4 mr-2" />
                Importar XML
              </button>
            </div>
            
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/60 transition-colors cursor-pointer"
                onClick={() => ocrFileInputRef.current?.click()}>
                <ScanLine className="h-10 w-10 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-1">Arraste PDF/Imagens aqui</p>
                <p className="text-xs text-gray-500">ou clique para selecionar</p>
                
                <input
                  ref={ocrFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleOcrUpload}
                />
              </div>
              <button className="w-full mt-2 btn-primary py-2">
                <ScanLine className="h-4 w-4 mr-2" />
                Processar OCR
              </button>
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Métricas-Chave</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <Settings className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <h4 className="text-sm text-gray-500 mb-1">Faturamento ({period})</h4>
              <p className="text-xl font-bold">{formatCurrency(45678.90)}</p>
              <div className="flex items-center mt-1 text-green-600 text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+12% vs. período anterior</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="text-sm text-gray-500 mb-1">Ticket Médio</h4>
              <p className="text-xl font-bold">{formatCurrency(123.45)}</p>
              <div className="flex items-center mt-1 text-green-600 text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5% vs. período anterior</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="text-sm text-gray-500 mb-1">Documentos Processados</h4>
              <p className="text-xl font-bold">126</p>
              <div className="mt-1 text-blue-600 text-sm">
                <span>Últimos 30 dias</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="text-sm text-gray-500 mb-1">Precisão OCR</h4>
              <p className="text-xl font-bold">96.5%</p>
              <div className="mt-1 text-green-600 text-sm">
                <span>Acima da meta (95%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Documentos Recentes</h3>
            <Link to="/sales/document-importer" className="text-primary text-sm">
              Ver Todos
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentImports.length > 0 ? (
              recentImports.slice(0, 5).map((doc, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <span className="font-medium text-gray-900">{doc.documentNumber || 'Sem número'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(doc.createdAt)}</p>
                  </div>
                  <div className="flex items-center">
                    {getImportStatusBadge(doc.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                Nenhum documento importado recentemente
              </div>
            )}
          </div>
        </div>
        
        {/* Recent OCR Processing */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">OCR Recentes</h3>
            <Link to="/sales/ocr-processor" className="text-primary text-sm">
              Ver Todos
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentOcrDocuments.length > 0 ? (
              recentOcrDocuments.slice(0, 5).map((doc, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <ScanLine className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-900 truncate max-w-[150px]">
                        {doc.sourceFile.split('/').pop()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(doc.createdAt)}</p>
                  </div>
                  <div className="flex items-center">
                    {getOcrStatusBadge(doc.processingStatus)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                Nenhum documento processado recentemente
              </div>
            )}
          </div>
        </div>
        
        {/* Configured Alerts */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Alertas Configurados</h3>
            <button className="text-primary text-sm flex items-center" onClick={() => setShowAlertModal(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Novo Alerta
            </button>
          </div>
          
          <div className="space-y-3">
            {alertConfigs.length > 0 ? (
              alertConfigs.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="font-medium text-gray-900">{alert.message || 'Alerta configurado'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.metricId} {alert.condition === 'lt' ? '<' : alert.condition === 'gt' ? '>' : '='} {alert.value}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {alert.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                Nenhum alerta configurado
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Documentation and Resources */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Documentação e Recursos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Análise de Vendas</h3>
            <p className="text-sm text-blue-700 mb-3">
              Aprenda a usar o dashboard de análise de vendas e configurar alertas personalizados.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Importação XML/NFe</h3>
            <p className="text-sm text-green-700 mb-3">
              Guia completo para importar documentos fiscais e atualizar seu estoque automaticamente.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-800 mb-2">Processamento OCR</h3>
            <p className="text-sm text-purple-700 mb-3">
              Instruções para usar o sistema OCR para digitalizar notas, recibos e extrair dados automaticamente.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Alert Configuration Modal */}
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
                    value={alertForm.metricId}
                    onChange={(e) => setAlertForm({...alertForm, metricId: e.target.value})}
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
                      value={alertForm.condition}
                      onChange={(e) => setAlertForm({...alertForm, condition: e.target.value})}
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
                      value={alertForm.value}
                      onChange={(e) => setAlertForm({...alertForm, value: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem do Alerta
                  </label>
                  <textarea
                    className="input w-full"
                    placeholder="Descreva o alerta..."
                    rows={3}
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({...alertForm, message: e.target.value})}
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Informação</p>
                    <p>Os alertas são enviados por email e exibidos no sistema quando a condição definida é atingida.</p>
                  </div>
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
                onClick={handleCreateAlert}
              >
                <Bell className="h-4 w-4 mr-2" />
                Criar Alerta
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
            <RefreshCw className="h-5 w-5 text-primary mr-3 animate-spin" />
            <span className="text-gray-700">Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationHub;