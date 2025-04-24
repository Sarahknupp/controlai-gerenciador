import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpDown,
  Edit, 
  Trash2, 
  Download,
  Upload,
  BarChart2,
  AlertTriangle,
  FileText,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Clock,
  ShoppingCart,
  Check,
  X,
  Plus,
  Calendar,
  Truck,
  ExternalLink,
  Save,
  FileUp,
  ClipboardCheck
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const UnifiedInventory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'resale' | 'ingredients'>('all');
  const [sortBy, setSortBy] = useState<{field: string, direction: 'asc' | 'desc'}>({field: 'name', direction: 'asc'});
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [newStock, setNewStock] = useState<{
    productId: number;
    quantity: number;
    batchNumber: string;
    expirationDate: string;
    supplier: string;
    notes: string;
  }>({
    productId: 0,
    quantity: 0,
    batchNumber: '',
    expirationDate: '',
    supplier: '',
    notes: ''
  });
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [shoppingList, setShoppingList] = useState<{
    id: number;
    name: string;
    category: string;
    type: string;
    currentStock: number;
    minStock: number;
    toBuy: number;
    unit: string;
    costPerUnit: number;
    total: number;
    supplier: string;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    inventoryItems,
    isLoading,
    error,
    updateItemQuantity,
    adjustInventory,
    generateInventoryTemplate,
    importInventory,
    generateReport
  } = useInventory();

  // Extract unique categories and suppliers from inventory items
  const categories = [
    { id: 'all', name: 'Todas Categorias' },
    ...Array.from(new Set(inventoryItems.map(item => item.category))).map(category => ({
      id: category,
      name: category
    }))
  ];

  const suppliers = [
    { id: 'all', name: 'Todos Fornecedores' },
    ...Array.from(new Set(inventoryItems.map(item => item.supplier))).map(supplier => ({
      id: supplier,
      name: supplier
    }))
  ];

  // Generate shopping list
  useEffect(() => {
    if (showShoppingListModal) {
      const lowStockItems = inventoryItems.filter(item => 
        item.actualQuantity < item.minQuantity
      );
      
      const list = lowStockItems.map(item => {
        const toBuy = Math.ceil(item.minQuantity * 1.5 - item.actualQuantity);
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          type: item.category.toLowerCase().includes('ingredient') ? 'ingredients' : 'resale',
          currentStock: item.actualQuantity,
          minStock: item.minQuantity,
          toBuy: toBuy > 0 ? toBuy : 0,
          unit: item.unit,
          costPerUnit: item.costPrice,
          total: toBuy * item.costPrice,
          supplier: item.supplier
        };
      });

      setShoppingList(list);
    }
  }, [showShoppingListModal, inventoryItems]);

  // Get unique suppliers for selected items
  const getUniqueSuppliers = () => {
    return Array.from(new Set(shoppingList.map(item => item.supplier)));
  };

  // Toggle expanded state of an item
  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(current => 
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    );
  };

  // Apply filters to inventory items
  const filteredItems = inventoryItems.filter(item => {
    // Search filter
    if (searchQuery && 
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    
    // Supplier filter
    if (supplierFilter !== 'all' && item.supplier !== supplierFilter) {
      return false;
    }
    
    // Type filter (ingredients or resale)
    if (typeFilter === 'ingredients' && !item.category.toLowerCase().includes('ingredient')) {
      return false;
    }
    if (typeFilter === 'resale' && item.category.toLowerCase().includes('ingredient')) {
      return false;
    }
    
    // Low stock only filter
    if (showLowStockOnly && item.actualQuantity >= item.minQuantity) {
      return false;
    }
    
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy.field) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'category':
        valueA = a.category.toLowerCase();
        valueB = b.category.toLowerCase();
        break;
      case 'quantity':
        valueA = a.actualQuantity;
        valueB = b.actualQuantity;
        break;
      case 'status':
        valueA = a.actualQuantity < a.minQuantity ? 0 : 1;
        valueB = b.actualQuantity < b.minQuantity ? 0 : 1;
        break;
      case 'lastUpdated':
        valueA = new Date(a.lastChecked).getTime();
        valueB = new Date(b.lastChecked).getTime();
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    if (sortBy.direction === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });

  // Calculate summary data
  const summaryData = {
    totalItems: inventoryItems.length,
    totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
    lowStockCount: inventoryItems.filter(item => item.actualQuantity < item.minQuantity).length,
    criticalStockCount: inventoryItems.filter(item => item.actualQuantity <= item.minQuantity * 0.5).length,
    lastUpdate: inventoryItems.length > 0 ? 
      inventoryItems.reduce((latest, item) => {
        const itemDate = new Date(item.lastChecked);
        return latest > itemDate ? latest : itemDate;
      }, new Date(0)).toLocaleDateString('pt-BR') : 'N/A'
  };

  // Filter shopping list by type and supplier
  const filteredShoppingList = shoppingList.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }
    if (selectedSupplier && item.supplier !== selectedSupplier) {
      return false;
    }
    return true;
  });

  // Calculate shopping list total
  const shoppingListTotal = filteredShoppingList.reduce((sum, item) => sum + item.total, 0);

  // Handle restock form submission
  const handleRestock = () => {
    if (!selectedItem || !newStock.quantity) return;
    
    // In a real implementation, this would call an API to add stock
    const quantity = selectedItem.actualQuantity + newStock.quantity;
    adjustInventory(selectedItem.id, quantity, `Reabastecimento: Lote ${newStock.batchNumber} - ${newStock.notes}`);
    
    setNewStock({
      productId: 0,
      quantity: 0,
      batchNumber: '',
      expirationDate: '',
      supplier: '',
      notes: ''
    });
    setShowRestockModal(false);
  };

  // Handle adjust quantity form submission
  const handleAdjustQuantity = () => {
    if (!selectedItem || !adjustQuantity || !adjustReason) return;
    
    const quantity = parseFloat(adjustQuantity);
    if (isNaN(quantity)) return;
    
    adjustInventory(selectedItem.id, quantity, adjustReason);
    
    setAdjustQuantity('');
    setAdjustReason('');
    setShowAdjustModal(false);
  };

  // Export shopping list to Excel
  const exportShoppingListToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    
    const wsData = filteredShoppingList.map(item => ({
      'Produto': item.name,
      'Categoria': item.category,
      'Estoque Atual': item.currentStock,
      'Estoque Mínimo': item.minStock,
      'Qtd. Comprar': item.toBuy,
      'Unidade': item.unit,
      'Custo Unit.': item.costPerUnit.toFixed(2),
      'Total': item.total.toFixed(2),
      'Fornecedor': item.supplier
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    
    // Add a summary row
    XLSX.utils.sheet_add_aoa(ws, [
      ['Total:', '', '', '', '', '', '', `R$ ${shoppingListTotal.toFixed(2)}`, '']
    ], { origin: -1 });
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, `lista_compras_${new Date().toISOString().split('T')[0]}${fileExtension}`);
  };

  // Export shopping list to PDF
  const exportShoppingListToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Lista de Compras', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
    
    if (selectedSupplier) {
      doc.text(`Fornecedor: ${selectedSupplier}`, 14, 32);
      doc.text(`Tipo: ${typeFilter === 'all' ? 'Todos' : typeFilter === 'ingredients' ? 'Ingredientes' : 'Revenda'}`, 14, 38);
    } else {
      doc.text(`Tipo: ${typeFilter === 'all' ? 'Todos' : typeFilter === 'ingredients' ? 'Ingredientes' : 'Revenda'}`, 14, 32);
    }
    
    const startY = selectedSupplier ? 44 : 38;
    
    // Prepare table data
    const tableColumn = ['Produto', 'Qtd. Atual', 'Min', 'Comprar', 'Un', 'Custo Un.', 'Total', 'Fornecedor'];
    const tableRows = filteredShoppingList.map(item => [
      item.name,
      item.currentStock.toString(),
      item.minStock.toString(),
      item.toBuy.toString(),
      item.unit,
      `R$ ${item.costPerUnit.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
      item.supplier
    ]);
    
    // Add total row
    tableRows.push([
      'TOTAL', '', '', '', '', '', `R$ ${shoppingListTotal.toFixed(2)}`, ''
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 40 },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });
    
    doc.save(`lista_compras_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Import inventory from file
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

  // Status indicators
  const getStatusIndicator = (item: any) => {
    const ratio = item.actualQuantity / item.minQuantity;
    
    if (ratio <= 0.5) {
      return <span className="badge bg-red-100 text-red-700">Crítico</span>;
    } else if (ratio < 1) {
      return <span className="badge bg-yellow-100 text-yellow-700">Baixo</span>;
    } else {
      return <span className="badge bg-green-100 text-green-700">Normal</span>;
    }
  };

  // Progress bar for stock level visualization
  const getStockProgressBar = (current: number, min: number) => {
    const ratio = current / min;
    let width = Math.min(ratio * 100, 100);
    let colorClass = '';
    
    if (ratio <= 0.5) {
      colorClass = 'bg-red-500';
    } else if (ratio < 1) {
      colorClass = 'bg-yellow-500';
    } else if (ratio < 2) {
      colorClass = 'bg-green-500';
    } else {
      colorClass = 'bg-blue-500';
      width = 100;
    }
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${width}%` }}></div>
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque Unificado</h1>
          <p className="text-gray-500">Gerencie seu inventário, conferências e abastecimento</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="btn-outline"
            onClick={generateReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowShoppingListModal(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Gerar Lista de Compras
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowRestockModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Reabastecer Estoque
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
            <p className="text-2xl font-bold text-gray-900">{summaryData.totalItems}</p>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <BarChart2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Valor em Estoque</h3>
            <p className="text-2xl font-bold text-gray-900">R$ {summaryData.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Estoque Baixo</h3>
            <p className="text-2xl font-bold text-gray-900">{summaryData.lowStockCount} itens</p>
            <button 
              className="text-xs text-yellow-600"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              {showLowStockOnly ? 'Mostrar todos' : 'Mostrar apenas baixo estoque'}
            </button>
          </div>
        </div>
        
        <div className="card flex items-center">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Críticos</h3>
            <p className="text-2xl font-bold text-gray-900">{summaryData.criticalStockCount} itens</p>
            <p className="text-xs text-gray-500">Última verificação: {summaryData.lastUpdate}</p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, código, lote..."
            className="input pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Type Filter */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${typeFilter === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setTypeFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${typeFilter === 'ingredients' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setTypeFilter('ingredients')}
          >
            Ingredientes
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${typeFilter === 'resale' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setTypeFilter('resale')}
          >
            Produtos para Revenda
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-2">
          <select
            className="select flex-1"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          
          <select
            className="select flex-1"
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
          >
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
          
          <div className="dropdown relative group">
            <button className="btn-outline py-2 px-3">
              <ArrowUpDown className="h-4 w-4" />
            </button>
            <div className="dropdown-menu absolute right-0 mt-1 py-1 w-56 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
              <button
                className={`w-full text-left px-4 py-2 text-sm ${sortBy.field === 'name' ? 'bg-gray-100' : ''}`}
                onClick={() => setSortBy({field: 'name', direction: sortBy.field === 'name' && sortBy.direction === 'asc' ? 'desc' : 'asc'})}
              >
                Nome {sortBy.field === 'name' && (sortBy.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${sortBy.field === 'category' ? 'bg-gray-100' : ''}`}
                onClick={() => setSortBy({field: 'category', direction: sortBy.field === 'category' && sortBy.direction === 'asc' ? 'desc' : 'asc'})}
              >
                Categoria {sortBy.field === 'category' && (sortBy.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${sortBy.field === 'quantity' ? 'bg-gray-100' : ''}`}
                onClick={() => setSortBy({field: 'quantity', direction: sortBy.field === 'quantity' && sortBy.direction === 'asc' ? 'desc' : 'asc'})}
              >
                Quantidade {sortBy.field === 'quantity' && (sortBy.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${sortBy.field === 'status' ? 'bg-gray-100' : ''}`}
                onClick={() => setSortBy({field: 'status', direction: sortBy.field === 'status' && sortBy.direction === 'asc' ? 'desc' : 'asc'})}
              >
                Status {sortBy.field === 'status' && (sortBy.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${sortBy.field === 'lastUpdated' ? 'bg-gray-100' : ''}`}
                onClick={() => setSortBy({field: 'lastUpdated', direction: sortBy.field === 'lastUpdated' && sortBy.direction === 'asc' ? 'desc' : 'asc'})}
              >
                Última Atualização {sortBy.field === 'lastUpdated' && (sortBy.direction === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Atual
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Mínimo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível de Estoque
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atualização
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedItems.map(item => (
                <React.Fragment key={item.id}>
                  <tr className={`hover:bg-gray-50 ${item.actualQuantity < item.minQuantity * 0.5 ? 'bg-red-50' : item.actualQuantity < item.minQuantity ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => toggleItemExpansion(item.id)}>
                      <div className="flex items-center">
                        <div className="mr-3">
                          {expandedItems.includes(item.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.supplier}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        {item.actualQuantity} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.minQuantity} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getStatusIndicator(item)}
                        {getStockProgressBar(item.actualQuantity, item.minQuantity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">R$ {item.totalValue.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Unitário: R$ {item.costPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {item.lastChecked}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            setSelectedItem(item);
                            setAdjustQuantity(item.actualQuantity.toString());
                            setShowAdjustModal(true);
                          }}
                          title="Ajustar Estoque"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            setSelectedItem(item);
                            setNewStock({
                              ...newStock,
                              productId: item.id,
                              supplier: item.supplier
                            });
                            setShowRestockModal(true);
                          }}
                          title="Reabastecer"
                        >
                          <Plus className="h-4 w-4 text-gray-500" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            const toBuy = Math.ceil(item.minQuantity * 1.5 - item.actualQuantity);
                            if (toBuy <= 0) {
                              alert('Este item não precisa ser reabastecido no momento.');
                              return;
                            }
                            setShoppingList([{
                              id: item.id,
                              name: item.name,
                              category: item.category,
                              type: item.category.toLowerCase().includes('ingredient') ? 'ingredients' : 'resale',
                              currentStock: item.actualQuantity,
                              minStock: item.minQuantity,
                              toBuy,
                              unit: item.unit,
                              costPerUnit: item.costPrice,
                              total: toBuy * item.costPrice,
                              supplier: item.supplier
                            }]);
                            setShowShoppingListModal(true);
                          }}
                          title="Adicionar à Lista de Compras"
                        >
                          <ShoppingCart className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {expandedItems.includes(item.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Movement history */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="p-3 bg-gray-100 font-medium">Histórico de Movimentações</div>
                            <div className="overflow-x-auto max-h-64">
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
                                    <tr key={index} className="hover:bg-gray-100">
                                      <td className="px-4 py-2 text-sm">{movement.date}</td>
                                      <td className="px-4 py-2 text-sm">
                                        {movement.type === 'entry' ? (
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                            Entrada
                                          </span>
                                        ) : movement.type === 'exit' ? (
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-red-100 text-red-800">
                                            Saída
                                          </span>
                                        ) : (
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                            Ajuste
                                          </span>
                                        )}
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
                          </div>
                          
                          {/* Product details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4 space-y-2">
                              <h4 className="font-medium text-gray-900">Detalhes do Produto</h4>
                              <p className="text-sm"><span className="font-medium">SKU:</span> {item.sku}</p>
                              <p className="text-sm"><span className="font-medium">Unidade:</span> {item.unit}</p>
                              <p className="text-sm"><span className="font-medium">Categoria:</span> {item.category}</p>
                              <p className="text-sm"><span className="font-medium">Localização:</span> {item.location}</p>
                            </div>
                            
                            <div className="border rounded-lg p-4 space-y-2">
                              <h4 className="font-medium text-gray-900">Informações Financeiras</h4>
                              <p className="text-sm"><span className="font-medium">Custo unitário:</span> R$ {item.costPrice.toFixed(2)}</p>
                              <p className="text-sm"><span className="font-medium">Valor total:</span> R$ {item.totalValue.toFixed(2)}</p>
                              <p className="text-sm"><span className="font-medium">Fornecedor:</span> {item.supplier}</p>
                              <p className="text-sm">
                                <span className="font-medium">Status:</span> {item.actualQuantity < item.minQuantity * 0.5 ? 'Crítico' : item.actualQuantity < item.minQuantity ? 'Baixo' : 'Normal'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="mt-4 flex justify-end space-x-3">
                          <button 
                            className="btn-outline py-1 px-3 text-sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustQuantity(item.actualQuantity.toString());
                              setShowAdjustModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2 inline" />
                            Ajustar Estoque
                          </button>
                          <button 
                            className="btn-primary py-1 px-3 text-sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setNewStock({
                                ...newStock,
                                productId: item.id,
                                supplier: item.supplier
                              });
                              setShowRestockModal(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2 inline" />
                            Reabastecer Estoque
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
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center mb-3">
            <ClipboardCheck className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Conferência de Estoque</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Execute contagens físicas de estoque para verificar e ajustar discrepâncias entre o sistema e o estoque real.
          </p>
          <div className="flex space-x-3">
            <button 
              className="btn-primary flex-1"
              onClick={() => {
                // This would normally start a new inventory count process
                alert("Iniciando nova contagem de estoque...");
              }}
            >
              Iniciar Contagem
            </button>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center mb-3">
            <FileUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Importar/Exportar</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Importe ou exporte dados de inventário para integração com outros sistemas ou análises em planilhas.
          </p>
          <div className="flex space-x-3">
            <button 
              className="btn-outline flex-1"
              onClick={generateInventoryTemplate}
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Modelo
            </button>
            <button 
              className="btn-primary flex-1"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Importar
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center mb-3">
            <Truck className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Pedidos de Compra</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Gerencie pedidos de compra para fornecedores baseados nas necessidades de reabastecimento.
          </p>
          <div className="flex space-x-3">
            <button 
              className="btn-primary flex-1"
              onClick={() => setShowShoppingListModal(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2 inline" />
              Lista de Compras
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {summaryData.lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-800">Alerta de Estoque Baixo</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {inventoryItems
              .filter(item => item.actualQuantity < item.minQuantity)
              .slice(0, 3)
              .map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-yellow-100 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="mr-2">
                        {item.actualQuantity} / {item.minQuantity} {item.unit}
                      </span>
                      {getStatusIndicator(item)}
                    </div>
                  </div>
                  <button 
                    className="btn-outline py-1 px-2 text-xs"
                    onClick={() => {
                      setSelectedItem(item);
                      setNewStock({
                        ...newStock,
                        productId: item.id,
                        supplier: item.supplier
                      });
                      setShowRestockModal(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1 inline" />
                    Reabastecer
                  </button>
                </div>
              ))
            }
          </div>
          
          {summaryData.lowStockCount > 3 && (
            <button 
              className="text-yellow-600 text-sm font-medium mt-3 flex items-center"
              onClick={() => setShowLowStockOnly(true)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver todos os {summaryData.lowStockCount} itens com estoque baixo
            </button>
          )}
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Lista de Compras</h2>
              <button 
                onClick={() => setShowShoppingListModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 150px)'}}>
              {/* Filter options */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button 
                    className={`px-4 py-1 rounded-md text-sm font-medium ${typeFilter === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTypeFilter('all')}
                  >
                    Todos
                  </button>
                  <button 
                    className={`px-4 py-1 rounded-md text-sm font-medium ${typeFilter === 'ingredients' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTypeFilter('ingredients')}
                  >
                    Ingredientes
                  </button>
                  <button 
                    className={`px-4 py-1 rounded-md text-sm font-medium ${typeFilter === 'resale' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTypeFilter('resale')}
                  >
                    Produtos para Revenda
                  </button>
                </div>
                
                <select 
                  className="select"
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Todos os Fornecedores</option>
                  {getUniqueSuppliers().map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
                
                <div className="ml-auto flex space-x-2">
                  <button 
                    className="btn-outline py-1 px-3 text-sm"
                    onClick={exportShoppingListToExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 inline" />
                    Excel
                  </button>
                  <button 
                    className="btn-outline py-1 px-3 text-sm"
                    onClick={exportShoppingListToPDF}
                  >
                    <FileText className="h-4 w-4 mr-2 inline" />
                    PDF
                  </button>
                </div>
              </div>
              
              {/* Shopping list table */}
              {filteredShoppingList.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque Atual
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque Mínimo
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade a Comprar
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidade
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custo Unitário
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fornecedor
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredShoppingList.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.category}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`font-medium ${item.currentStock < item.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.minStock} {item.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input 
                              type="number"
                              className="border rounded w-20 py-1 px-2 text-right"
                              value={item.toBuy}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setShoppingList(
                                  shoppingList.map(i => 
                                    i.id === item.id 
                                      ? {...i, toBuy: value, total: value * i.costPerUnit} 
                                      : i
                                  )
                                );
                              }}
                              min="0"
                            />
                            <span className="ml-1 text-sm">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            R$ {item.costPerUnit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              R$ {item.total.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.supplier}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                setShoppingList(shoppingList.filter(i => i.id !== item.id));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-3 whitespace-nowrap" colSpan={7}>
                          Total
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold">
                          R$ {shoppingListTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum item encontrado</h3>
                  <p className="text-gray-500">
                    {shoppingList.length === 0 
                      ? "Não há itens com estoque baixo no momento." 
                      : "Nenhum item corresponde aos filtros selecionados."}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {filteredShoppingList.length} itens listados • Valor total: <span className="font-bold">R$ {shoppingListTotal.toFixed(2)}</span>
              </div>
              <div className="flex space-x-3">
                <button 
                  className="btn-outline"
                  onClick={() => setShowShoppingListModal(false)}
                >
                  Fechar
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    alert("Pedido de compra gerado com sucesso!");
                    setShowShoppingListModal(false);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Gerar Pedido de Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Reabastecer Estoque
                {selectedItem && ` - ${selectedItem.name}`}
              </h2>
              <button 
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedItem ? (
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Por favor, selecione um item para reabastecer.</p>
                </div>
              ) : (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Atual</label>
                    <div className="bg-gray-100 p-2 rounded-md">
                      <span className="font-medium">
                        {selectedItem.actualQuantity} {selectedItem.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade a Adicionar *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      className="input"
                      value={newStock.quantity}
                      onChange={e => setNewStock({...newStock, quantity: parseInt(e.target.value) || 0})}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                      Fornecedor *
                    </label>
                    <input
                      type="text"
                      id="supplier"
                      className="input"
                      value={newStock.supplier}
                      onChange={e => setNewStock({...newStock, supplier: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Número do Lote
                      </label>
                      <input
                        type="text"
                        id="batchNumber"
                        className="input"
                        value={newStock.batchNumber}
                        onChange={e => setNewStock({...newStock, batchNumber: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Validade
                      </label>
                      <input
                        type="date"
                        id="expirationDate"
                        className="input"
                        value={newStock.expirationDate}
                        onChange={e => setNewStock({...newStock, expirationDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      id="notes"
                      className="input"
                      rows={3}
                      value={newStock.notes}
                      onChange={e => setNewStock({...newStock, notes: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total a ser adicionado:</span>
                      <span className="font-bold">
                        {newStock.quantity} {selectedItem.unit} (+ R$ {(newStock.quantity * selectedItem.costPrice).toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Novo estoque após operação:</span>
                      <span className="font-bold">
                        {selectedItem.actualQuantity + newStock.quantity} {selectedItem.unit}
                      </span>
                    </div>
                  </div>
                  
                </form>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                className="btn-outline"
                onClick={() => setShowRestockModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleRestock}
                disabled={!selectedItem || !newStock.quantity || !newStock.supplier}
              >
                <Save className="h-4 w-4 mr-2" />
                Confirmar Reabastecimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Quantity Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Ajustar Estoque
                {selectedItem && ` - ${selectedItem.name}`}
              </h2>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedItem ? (
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Por favor, selecione um item para ajustar.</p>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Atual
                      </label>
                      <div className="bg-gray-100 p-2 rounded-md">
                        <span className="font-medium">
                          {selectedItem.actualQuantity} {selectedItem.unit}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Mínima
                      </label>
                      <div className="bg-gray-100 p-2 rounded-md">
                        <span className="font-medium">
                          {selectedItem.minQuantity} {selectedItem.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Quantidade *
                    </label>
                    <input
                      type="number"
                      id="newQuantity"
                      className="input"
                      value={adjustQuantity}
                      onChange={e => setAdjustQuantity(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="adjustReason" className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo do Ajuste *
                    </label>
                    <select
                      id="adjustReason"
                      className="input"
                      value={adjustReason}
                      onChange={e => setAdjustReason(e.target.value)}
                      required
                    >
                      <option value="">Selecione um motivo</option>
                      <option value="Contagem física">Contagem física</option>
                      <option value="Produto danificado">Produto danificado</option>
                      <option value="Produto expirado">Produto expirado</option>
                      <option value="Erro de lançamento">Erro de lançamento</option>
                      <option value="Consumo interno">Consumo interno</option>
                      <option value="Perda">Perda</option>
                      <option value="Promoção">Promoção/bonificação</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  
                  {adjustReason === 'Outro' && (
                    <div>
                      <label htmlFor="otherReason" className="block text-sm font-medium text-gray-700 mb-1">
                        Especifique o Motivo *
                      </label>
                      <textarea
                        id="otherReason"
                        className="input"
                        rows={3}
                        value={adjustReason === 'Outro' ? '' : adjustReason}
                        onChange={e => setAdjustReason(e.target.value)}
                        required={adjustReason === 'Outro'}
                      ></textarea>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Diferença:</span>
                      <span className={`font-bold ${parseFloat(adjustQuantity) > selectedItem.actualQuantity ? 'text-green-600' : parseFloat(adjustQuantity) < selectedItem.actualQuantity ? 'text-red-600' : 'text-gray-600'}`}>
                        {parseFloat(adjustQuantity) > selectedItem.actualQuantity ? '+' : ''}
                        {(parseFloat(adjustQuantity) - selectedItem.actualQuantity).toFixed(2)} {selectedItem.unit}
                      </span>
                    </div>
                  </div>
                </form>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                className="btn-outline"
                onClick={() => setShowAdjustModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleAdjustQuantity}
                disabled={!selectedItem || !adjustQuantity || !adjustReason}
              >
                <Save className="h-4 w-4 mr-2" />
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv,.xlsx,.xls" 
        onChange={handleFileUpload} 
      />
    </div>
  );
};

export default UnifiedInventory;