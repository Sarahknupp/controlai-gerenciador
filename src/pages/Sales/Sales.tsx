import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  BarChart2,
  Scissors,
  Truck,
  Settings,
  ScanLine,
  FileUp,
  Upload,
  PieChart,
  FolderSync,
  Search,
  LayoutGrid,
  Moon,
  Table,
  Zap
} from 'lucide-react';

const Sales: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-500">Gerencie clientes, produtos e vendas</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/pdv-modern" className="btn-primary">
            <LayoutGrid className="h-4 w-4 mr-2" />
            PDV Aprimorado
          </Link>
          
          <Link to="/modern-checkout" className="btn-outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vendas Hoje</h3>
              <p className="text-2xl font-bold text-gray-900">R$ 3.459,20</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <BarChart2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
              <p className="text-2xl font-bold text-gray-900">R$ 48,72</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Produtos Vendidos</h3>
              <p className="text-2xl font-bold text-gray-900">86</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Clientes Atendidos</h3>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PDV Modern Card - Highlighted */}
        <Link to="/pdv-modern" className="card hover:shadow-lg transition-shadow cursor-pointer border-primary border-2 bg-primary/5">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">PDV Aprimorado</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Experimente o novo PDV com modo escuro, mesas, atalhos de teclado e interface personalizada.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              <Moon className="h-3 w-3 mr-1" />
              Modo escuro
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              <Table className="h-3 w-3 mr-1" />
              Gestão de mesas
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              <Settings className="h-3 w-3 mr-1" />
              Personalização
            </span>
          </div>
        </Link>
        
        {/* Automation Hub */}
        <Link to="/sales/automation" className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-amber-600">Central de Automação</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Integre análise de vendas, importação de documentos fiscais e OCR em um único lugar.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
              <BarChart2 className="h-3 w-3 mr-1" />
              Dashboard
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
              <FileUp className="h-3 w-3 mr-1" />
              Importação XML
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
              <ScanLine className="h-3 w-3 mr-1" />
              Processamento OCR
            </span>
          </div>
        </Link>
        
        {/* Customer Management */}
        <Link to="/sales/customers" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Clientes</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Gerencie cadastros de clientes, histórico de compras e análise de perfil de consumo.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar cadastro de clientes
          </div>
        </Link>
        
        {/* Product Management */}
        <Link to="/sales/products" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Produtos</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Cadastre e gerencie produtos, categorias, preços e códigos de barras.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar cadastro de produtos
          </div>
        </Link>
        
        {/* Inventory Control */}
        <Link to="/sales/inventory" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <FolderSync className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Gestão de Estoque</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Controle entradas, saídas, leitura de códigos de barras e importação de documentos fiscais.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar controle de estoque
          </div>
        </Link>
        
        {/* Sales Data */}
        <Link to="/sales/analytics" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
              <PieChart className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Análise de Vendas</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Visualize relatórios de vendas, tendências e métricas de desempenho comercial.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar análise de vendas
          </div>
        </Link>
        
        {/* Document Import */}
        <Link to="/sales/document-importer" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <FileUp className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Importação</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Importe documentos fiscais (NF-e, NFC-e) e atualize automaticamente seu estoque.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar importador de documentos
          </div>
        </Link>
        
        {/* Fiscal Documents */}
        <Link to="/sales/fiscal" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Documentos Fiscais</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Emissão, gerenciamento e configuração de NF-e, NFC-e e outros documentos fiscais.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar documentos fiscais
          </div>
        </Link>
        
        {/* OCR Document Reader */}
        <Link to="/sales/ocr-processor" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
              <ScanLine className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Leitor OCR</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Escaneie documentos fiscais e extraia os dados automaticamente utilizando tecnologia OCR.
          </p>
          <div className="flex items-center text-primary font-medium">
            Acessar leitor OCR
          </div>
        </Link>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar venda..."
              className="input pl-10 py-1 text-sm"
              style={{ maxWidth: "250px" }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Itens
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sample data - would be mapped from real data in a full implementation */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #00123
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15/05/2025 14:30
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Maria Silva
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  5 itens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  R$ 125,50
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Cartão de Crédito
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-success">Concluída</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #00122
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15/05/2025 13:45
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  João Santos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  3 itens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  R$ 87,20
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  PIX
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-success">Concluída</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #00121
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15/05/2025 12:15
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Carlos Oliveira
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  8 itens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  R$ 215,30
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Dinheiro
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-success">Concluída</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button className="text-primary text-sm font-medium">
            Ver todas as vendas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;