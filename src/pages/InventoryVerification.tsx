import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpDown,
  Edit, 
  Calendar,
  Download,
  Upload,
  BarChart2,
  CheckCircle,
  X,
  AlertTriangle,
  FileText,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Truck,
  ClipboardCheck,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const InventoryVerification: React.FC = () => {
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscrepancies, setShowDiscrepancies] = useState(false);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  
  // Sample data
  const inventoryItems = [
    {
      id: 1,
      name: 'Farinha de Trigo',
      sku: 'MTRE001',
      category: 'Ingredientes',
      supplier: 'Distribuidora de Farinhas ABC',
      expectedQuantity: 75,
      actualQuantity: 75,
      unit: 'kg',
      costPrice: 3.20,
      totalValue: 240.00,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '10/05/2025', type: 'entry', quantity: 25, by: 'João Silva', note: 'Recebimento de fornecedor' },
        { date: '11/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Produção de pão francês' },
        { date: '13/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Produção de pão italiano' }
      ],
      status: 'normal'
    },
    {
      id: 2,
      name: 'Açúcar Refinado',
      sku: 'ACUC001',
      category: 'Ingredientes',
      supplier: 'Açúcar & Adoçantes Ltda',
      expectedQuantity: 50,
      actualQuantity: 42,
      unit: 'kg',
      costPrice: 4.90,
      totalValue: 205.80,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '05/05/2025', type: 'entry', quantity: 50, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
        { date: '08/05/2025', type: 'exit', quantity: 5, by: 'Sistema', note: 'Produção de bolos' },
        { date: '12/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Produção de doces' }
      ],
      status: 'discrepancy'
    },
    {
      id: 3,
      name: 'Leite Integral',
      sku: 'LEIT001',
      category: 'Ingredientes',
      supplier: 'Laticínios do Vale',
      expectedQuantity: 30,
      actualQuantity: 28,
      unit: 'L',
      costPrice: 4.50,
      totalValue: 126.00,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '08/05/2025', type: 'entry', quantity: 30, by: 'João Silva', note: 'Recebimento de fornecedor' },
        { date: '10/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Produção de pão de leite' }
      ],
      status: 'normal'
    },
    {
      id: 4,
      name: 'Refrigerante Cola',
      sku: 'REFR001',
      category: 'Bebidas',
      supplier: 'Bebidas Express',
      expectedQuantity: 48,
      actualQuantity: 45,
      unit: 'un',
      costPrice: 6.50,
      totalValue: 292.50,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '12/05/2025', type: 'entry', quantity: 48, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
        { date: '14/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Vendas via PDV' }
      ],
      status: 'normal'
    },
    {
      id: 5,
      name: 'Água Mineral',
      sku: 'AGUA001',
      category: 'Bebidas',
      supplier: 'Bebidas Express',
      expectedQuantity: 36,
      actualQuantity: 30,
      unit: 'un',
      costPrice: 1.85,
      totalValue: 55.50,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '12/05/2025', type: 'entry', quantity: 36, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
        { date: '13/05/2025', type: 'exit', quantity: 4, by: 'Sistema', note: 'Vendas via PDV' },
        { date: '14/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Vendas via PDV' }
      ],
      status: 'discrepancy'
    },
    {
      id: 6,
      name: 'Chocolate em Pó',
      sku: 'CHOC001',
      category: 'Ingredientes',
      supplier: 'Distribuidora de Alimentos XYZ',
      expectedQuantity: 15,
      actualQuantity: 12,
      unit: 'kg',
      costPrice: 18.90,
      totalValue: 226.80,
      lastChecked: '15/05/2025',
      movementHistory: [
        { date: '01/05/2025', type: 'entry', quantity: 15, by: 'João Silva', note: 'Recebimento de fornecedor' },
        { date: '07/05/2025', type: 'exit', quantity: 1.5, by: 'Sistema', note: 'Produção de bolos' },
        { date: '10/05/2025', type: 'exit', quantity: 1.5, by: 'Sistema', note: 'Produção de bolos' }
      ],
      status: 'normal'
    }
  ];

  // Categories and Suppliers for filters
  const categories = [
    { id: 'all', name: 'Todas Categorias' },
    { id: 'Ingredientes', name: 'Ingredientes' },
    { id: 'Bebidas', name: 'Bebidas' },
    { id: 'Embalagens', name: 'Embalagens' },
    { id: 'Limpeza', name: 'Limpeza' }
  ];

  const suppliers = [
    { id: 'all', name: 'Todos Fornecedores' },
    { id: 'Distribuidora de Farinhas ABC', name: 'Distribuidora de Farinhas ABC' },
    { id: 'Laticínios do Vale', name: 'Laticínios do Vale' },
    { id: 'Bebidas Express', name: 'Bebidas Express' },
    { id: 'Açúcar & Adoçantes Ltda', name: 'Açúcar & Adoçantes Ltda' },
    { id: 'Distribuidora de Alimentos XYZ', name: 'Distribuidora de Alimentos XYZ' }
  ];

  // Calculate total inventory value
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
  const totalItems = inventoryItems.length;
  const discrepancyItems = inventoryItems.filter(item => item.status === 'discrepancy').length;

  const toggleItemDetails = (itemId: number) => {
    setExpandedItems(current => 
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'badge-success';
      case 'discrepancy':
        return 'badge-error';
      case 'entry':
        return 'bg-green-100 text-green-600';
      case 'exit':
        return 'bg-red-100 text-red-600';
      case 'adjustment':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return 'Correto';
      case 'discrepancy':
        return 'Divergente';
      case 'entry':
        return 'Entrada';
      case 'exit':
        return 'Saída';
      case 'adjustment':
        return 'Ajuste';
      default:
        return status;
    }
  };

  // Filter inventory items
  const filteredItems = inventoryItems
    .filter(item => {
      if (showDiscrepancies && item.status !== 'discrepancy') {
        return false;
      }
      
      // Filter by category
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false;
      }
      
      // Filter by supplier
      if (filterSupplier !== 'all' && item.supplier !== filterSupplier) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) 
          && !item.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conferência de Estoque</h1>
          <p className="text-gray-500">Verifique e reconcilie seu inventário de produtos</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline">
            <Calendar className="h-4 w-4 mr-2" />
            Programar Conferência
          </button>
          <div className="dropdown relative">
            <button className="btn-primary">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
              <p className="text-2xl font-bold text-gray-900">{totalItems} itens</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
              <BarChart2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor Total do Estoque</h3>
              <p className="text-2xl font-bold text-gray-900">R$ {totalInventoryValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-red-50 border border-red-100">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Itens com Divergência</h3>
              <p className="text-2xl font-bold text-gray-900">{discrepancyItems} itens</p>
              {discrepancyItems > 0 && (
                <button 
                  className="text-sm text-red-600 font-medium mt-1"
                  onClick={() => setShowDiscrepancies(!showDiscrepancies)}
                >
                  {showDiscrepancies ? 'Mostrar todos os itens' : 'Mostrar apenas divergências'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar produto por nome ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <select 
            className="select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select 
            className="select"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          
          <select 
            className="select"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value as any)}
          >
            <option value="all">Todas as datas</option>
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            Mais Filtros
          </button>
          <button className="btn-outline">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex space-x-3 justify-end">
        <button className="btn-outline flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </button>
        <button className="btn-outline flex items-center">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel
        </button>
        <button className="btn-outline flex items-center">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-container shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-th">Produto</th>
              <th className="table-th">Categoria</th>
              <th className="table-th">Fornecedor</th>
              <th className="table-th">Qtd. Esperada</th>
              <th className="table-th">Qtd. Atual</th>
              <th className="table-th">Divergência</th>
              <th className="table-th">Valor Total</th>
              <th className="table-th">Status</th>
              <th className="table-th">Última Verificação</th>
              <th className="table-th">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <React.Fragment key={item.id}>
                <tr 
                  className={`table-row ${item.status === 'discrepancy' ? 'bg-red-50' : ''}`}
                  onClick={() => toggleItemDetails(item.id)}
                >
                  <td className="table-td font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {expandedItems.includes(item.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        {item.name}
                        <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">{item.category}</td>
                  <td className="table-td">{item.supplier}</td>
                  <td className="table-td font-medium">{item.expectedQuantity} {item.unit}</td>
                  <td className="table-td font-medium">
                    <div className="flex items-center">
                      {item.actualQuantity} {item.unit}
                      <button className="ml-2 text-primary text-xs">
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="table-td font-medium">
                    <div className={item.actualQuantity !== item.expectedQuantity ? 'text-red-600' : 'text-green-600'}>
                      {item.actualQuantity - item.expectedQuantity} {item.unit}
                    </div>
                  </td>
                  <td className="table-td font-medium">R$ {item.totalValue.toFixed(2)}</td>
                  <td className="table-td">
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="table-td text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {item.lastChecked}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded detail row */}
                {expandedItems.includes(item.id) && (
                  <tr className={`bg-gray-50 ${item.status === 'discrepancy' ? 'bg-red-50/30' : ''}`}>
                    <td colSpan={10} className="p-4">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-3 font-medium">Histórico de Movimentações</div>
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {item.movementHistory.map((movement, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{movement.date}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`badge ${getStatusBadgeClass(movement.type)}`}>
                                    {getStatusLabel(movement.type)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {movement.type === 'entry' ? '+' : '-'}{movement.quantity} {item.unit}
                                </td>
                                <td className="px-4 py-2 text-sm">{movement.by}</td>
                                <td className="px-4 py-2 text-sm">{movement.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button className="btn-outline text-sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reconciliar
                        </button>
                        <button className="btn-primary text-sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Ajustar Estoque
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Verification Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nova Contagem</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Inicie uma nova contagem de estoque para verificar e reconciliar as quantidades reais de produtos.
          </p>
          <button className="btn-primary w-full">Iniciar Contagem</button>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <UploadCloud className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Importar Inventário</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Importe uma planilha com as quantidades contadas para atualização em massa do seu estoque.
          </p>
          <div className="flex items-center space-x-4">
            <button className="btn-outline flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </button>
            <button className="btn-primary flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <BarChart2 className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Relatórios de Estoque</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Acesse relatórios detalhados sobre seu inventário, movimentações e valorização.
          </p>
          <button className="btn-outline w-full">Ver Relatórios</button>
        </div>
      </div>

      {/* Linked Inventory Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestão de Estoque</h3>
              <p className="text-gray-500">Acesse o módulo completo de gestão de estoque e cadastro de produtos</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link to="/sales/products" className="btn-outline">
              Cadastro de Produtos
            </Link>
            <Link to="/sales/inventory" className="btn-primary">
              Gestão de Estoque
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Truck className="h-4 w-4 text-primary mr-2" />
              <h4 className="font-medium text-gray-900">Entradas Pendentes</h4>
            </div>
            <p className="text-gray-600 mb-2 text-sm">3 pedidos aguardando recebimento</p>
            <button className="text-primary text-sm font-medium">Ver Detalhes</button>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <h4 className="font-medium text-gray-900">Estoque Baixo</h4>
            </div>
            <p className="text-gray-600 mb-2 text-sm">5 produtos abaixo do mínimo</p>
            <button className="text-primary text-sm font-medium">Ver Detalhes</button>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-green-600 mr-2" />
              <h4 className="font-medium text-gray-900">Última Conferência</h4>
            </div>
            <p className="text-gray-600 mb-2 text-sm">Realizada em 15/05/2025</p>
            <button className="text-primary text-sm font-medium">Ver Relatório</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryVerification;