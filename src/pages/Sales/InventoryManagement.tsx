import React, { useState, useRef } from 'react';
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
  AlertTriangle as AlertTriangleIcon,
  FileText,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Truck,
  ClipboardCheck as ClipboardCheckIcon,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory, InventoryItem } from '../../hooks/useInventory';

const InventoryManagement: React.FC = () => {
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscrepancies, setShowDiscrepancies] = useState(false);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    inventoryItems,
    isLoading,
    error,
    startInventoryCount,
    updateItemQuantity,
    reconcileInventory,
    adjustInventory,
    generateInventoryTemplate,
    importInventory,
    generateReport
  } = useInventory();

  // Categories and Suppliers for filters (generated from inventory items)
  const categories = [
    { id: 'all', name: 'Todas Categorias' },
    ...Array.from(new Set(inventoryItems.map(item => item.category))).map(cat => ({
      id: cat,
      name: cat
    }))
  ];

  const suppliers = [
    { id: 'all', name: 'Todos Fornecedores' },
    ...Array.from(new Set(inventoryItems.map(item => item.supplier))).map(sup => ({
      id: sup,
      name: sup
    }))
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

  // Handle starting a new inventory count
  const handleStartInventoryCount = async () => {
    try {
      await startInventoryCount();
    } catch (err) {
      console.error('Failed to start inventory count', err);
    }
  };

  // Handle reconciling inventory for a specific item
  const handleReconcileItem = async (itemId: number) => {
    try {
      await reconcileInventory(itemId);
    } catch (err) {
      console.error('Failed to reconcile inventory', err);
    }
  };

  // Handle quantity update
  const handleQuantityChange = async (itemId: number, newValue: number) => {
    try {
      await updateItemQuantity(itemId, newValue);
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  // Handle showing the adjust modal
  const handleShowAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity(item.actualQuantity.toString());
    setAdjustmentReason('');
    setShowAdjustModal(true);
  };

  // Handle inventory adjustment
  const handleAdjustInventory = async () => {
    if (!selectedItem || !newQuantity || !adjustmentReason) return;
    
    try {
      const qty = parseFloat(newQuantity);
      if (isNaN(qty)) {
        alert('Por favor, insira uma quantidade válida');
        return;
      }
      
      await adjustInventory(selectedItem.id, qty, adjustmentReason);
      setShowAdjustModal(false);
    } catch (err) {
      console.error('Failed to adjust inventory', err);
    }
  };

  // Handle import file selection
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        await importInventory(content);
      } catch (err) {
        console.error('Failed to import file', err);
      }
    };
    reader.readAsText(file);
    
    // Reset input value so the same file can be selected again
    e.target.value = '';
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
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Processando operação...</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conferência de Estoque</h1>
          <p className="text-gray-500">Verifique e reconcilie seu inventário de produtos</p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="btn-outline"
            onClick={() => {
              const date = new Date();
              const formattedDate = date.toLocaleDateString('pt-BR');
              alert(`Conferência programada para ${formattedDate} às 08:00`);
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Programar Conferência
          </button>
          <div className="dropdown relative">
            <button 
              className="btn-primary"
              onClick={generateReport}
            >
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
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
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
        <button 
          className="btn-outline flex items-center"
          onClick={generateReport}
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </button>
        <button 
          className="btn-outline flex items-center"
          onClick={generateReport}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel
        </button>
        <button 
          className="btn-outline flex items-center"
          onClick={() => {
            alert('Preparando documento para impressão...');
            setTimeout(() => alert('Documento enviado para impressão'), 1000);
          }}
        >
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
                      <input 
                        className="w-16 px-2 py-1 border rounded mr-2 text-center"
                        value={item.actualQuantity}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            handleQuantityChange(item.id, value);
                          }
                        }}
                      />
                      {item.unit}
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
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowAdjustModal(item);
                        }}
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReconcileItem(item.id);
                        }}
                      >
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
                        <button 
                          className="btn-outline text-sm"
                          onClick={() => handleReconcileItem(item.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reconciliar
                        </button>
                        <button 
                          className="btn-primary text-sm"
                          onClick={() => handleShowAdjustModal(item)}
                        >
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
              <ClipboardCheckIcon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nova Contagem</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Inicie uma nova contagem de estoque para verificar e reconciliar as quantidades reais de produtos.
          </p>
          <button 
            className="btn-primary w-full"
            onClick={handleStartInventoryCount}
          >
            Iniciar Contagem
          </button>
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
            <button 
              className="btn-outline flex-1"
              onClick={generateInventoryTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </button>
            <button 
              className="btn-primary flex-1"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv,.xls,.xlsx" 
              className="hidden" 
              onChange={handleFileUpload}
            />
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
          <button 
            className="btn-outline w-full"
            onClick={generateReport}
          >
            Ver Relatórios
          </button>
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
            <Link to="/inventory" className="btn-primary">
              Estoque Principal
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
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
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

      {/* Adjust Inventory Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Ajustar Estoque</h3>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-900">{selectedItem.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({selectedItem.sku})</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Quantidade Esperada</label>
                    <div className="bg-gray-100 p-2 rounded text-gray-900 font-medium">
                      {selectedItem.expectedQuantity} {selectedItem.unit}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Quantidade Atual</label>
                    <div className="bg-gray-100 p-2 rounded text-gray-900 font-medium">
                      {selectedItem.actualQuantity} {selectedItem.unit}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Quantidade *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    className="input flex-1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    step="0.01"
                    min="0"
                    required
                  />
                  <span className="ml-2">{selectedItem.unit}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo do Ajuste *
                </label>
                <select
                  className="select"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  required
                >
                  <option value="">Selecione um motivo</option>
                  <option value="Contagem física">Contagem física</option>
                  <option value="Correção de erro">Correção de erro</option>
                  <option value="Produto danificado">Produto danificado</option>
                  <option value="Produto vencido">Produto vencido</option>
                  <option value="Roubo/Furto">Roubo/Furto</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              {adjustmentReason === 'Outro' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especifique o Motivo *
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    required
                  ></textarea>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className="btn-outline"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleAdjustInventory}
                >
                  Confirmar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;