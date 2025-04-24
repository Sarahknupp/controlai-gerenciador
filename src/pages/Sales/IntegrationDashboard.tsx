import React from 'react';
import { 
  BarChart2, 
  ChevronLeft,
  PieChart, 
  FileText, 
  Upload, 
  FileUp, 
  Scan, 
  ArrowRightCircle,
  Cloud,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Dashboard principal para as APIs de integração e automação
 */
const IntegrationDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ChevronLeft 
            className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
            onClick={() => window.history.back()}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automação e Integração</h1>
            <p className="text-gray-500">Central de integração de dados e sistemas</p>
          </div>
        </div>
      </div>

      {/* Módulos de Integração */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Análise de Vendas */}
        <Link to="/sales/analytics" className="card hover:shadow-md transition-shadow p-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BarChart2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Análise de Vendas</h3>
          <p className="text-gray-600 mb-4">
            Dashboard analítico com KPIs, gráficos, relatórios automáticos e alertas de métricas críticas.
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex space-x-1">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">Dashboard</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">KPIs</span>
            </div>
            <ArrowRightCircle className="h-5 w-5 text-primary" />
          </div>
        </Link>
        
        {/* Importação de Documentos Fiscais */}
        <Link to="/sales/document-importer" className="card hover:shadow-md transition-shadow p-6">
          <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Importação de Documentos Fiscais</h3>
          <p className="text-gray-600 mb-4">
            Leitura automática de XML/NFe, validação fiscal, atualização de estoque e contas a pagar.
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex space-x-1">
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">XML</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">NFe</span>
            </div>
            <ArrowRightCircle className="h-5 w-5 text-primary" />
          </div>
        </Link>
        
        {/* OCR para Documentos */}
        <Link to="/sales/ocr-processor" className="card hover:shadow-md transition-shadow p-6">
          <div className="h-14 w-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <Scan className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">OCR para Documentos</h3>
          <p className="text-gray-600 mb-4">
            Extraia dados de notas, recibos e faturas em formato PDF/imagem com reconhecimento automático.
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex space-x-1">
              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">OCR</span>
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">PDF</span>
            </div>
            <ArrowRightCircle className="h-5 w-5 text-primary" />
          </div>
        </Link>
      </div>

      {/* Painel de Status das APIs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Status das APIs</h2>
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa de Sucesso
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Verificação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* API de Análise de Vendas */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BarChart2 className="h-5 w-5 text-blue-500 mr-3" />
                    <div className="text-sm font-medium text-gray-900">Análise de Vendas</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Online
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  99.8%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Agora mesmo
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-primary-dark">
                    Detalhes
                  </button>
                </td>
              </tr>
              
              {/* API de Importação de Documentos */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileUp className="h-5 w-5 text-green-500 mr-3" />
                    <div className="text-sm font-medium text-gray-900">Importação de Documentos</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Online
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  98.5%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Há 5 minutos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-primary-dark">
                    Detalhes
                  </button>
                </td>
              </tr>
              
              {/* API de OCR */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Scan className="h-5 w-5 text-purple-500 mr-3" />
                    <div className="text-sm font-medium text-gray-900">OCR Processing</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Online
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  97.2%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Há 10 minutos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-primary-dark">
                    Detalhes
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Documentação e Recursos */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Documentação e Recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">API de Análise de Vendas</h3>
            <p className="text-sm text-blue-700 mb-3">
              Explore os endpoints para coleta e análise de dados de vendas em tempo real.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ArrowRightCircle className="h-4 w-4 ml-1" />
            </a>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">API de Documentos Fiscais</h3>
            <p className="text-sm text-green-700 mb-3">
              Aprenda como automatizar a importação e validação de documentos fiscais.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ArrowRightCircle className="h-4 w-4 ml-1" />
            </a>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-800 mb-2">API de OCR</h3>
            <p className="text-sm text-purple-700 mb-3">
              Guia para processamento de imagens e extração de textos com OCR.
            </p>
            <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center">
              Ver documentação
              <ArrowRightCircle className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDashboard;