import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Download,
  BarChart2,
  AlertTriangle,
  Package,
  Layers,
  Save,
  FileUp,
  FilePlus,
  ShoppingCart
} from 'lucide-react';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  type: 'ingredients' | 'resale';
  unit: string;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  salePrice?: number;
  totalValue: number;
  lastRestock: string;
  location: string;
  status: 'normal' | 'low' | 'out';
}

const Inventory: React.FC = () => {
  const [inventoryType, setInventoryType] = useState<'all' | 'resale' | 'ingredients'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItems, setRestockItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantityToPurchase, setQuantityToPurchase] = useState<Record<number, number>>({});
  
  // Original inventory data
  const inventoryItems = [
    {
      id: 1,
      name: 'Farinha de Trigo',
      category: 'Ingredientes',
      type: 'ingredients',
      unit: 'kg',
      quantity: 120,
      minQuantity: 50,
      costPerUnit: 4.50,
      totalValue: 540,
      lastRestock: '10/05/2025',
      location: 'Estoque Principal',
      status: 'normal',
      urgencyLevel: 'none'
    },
    {
      id: 2,
      name: 'Açúcar Refinado',
      category: 'Ingredientes',
      type: 'ingredients',
      unit: 'kg',
      quantity: 85,
      minQuantity: 30,
      costPerUnit: 5.20,
      totalValue: 442,
      lastRestock: '08/05/2025',
      location: 'Estoque Principal',
      status: 'normal',
      urgencyLevel: 'none'
    },
    {
      id: 3,
      name: 'Chocolate em Pó',
      category: 'Ingredientes',
      type: 'ingredients',
      unit: 'kg',
      quantity: 12,
      minQuantity: 15,
      costPerUnit: 18.90,
      totalValue: 226.80,
      lastRestock: '01/05/2025',
      location: 'Estoque Principal',
      status: 'low',
      urgencyLevel: 'medium'
    },
    {
      id: 4,
      name: 'Refrigerante Cola',
      category: 'Bebidas',
      type: 'resale',
      unit: 'un',
      quantity: 48,
      minQuantity: 24,
      costPerUnit: 3.80,
      salePrice: 5.50,
      totalValue: 182.40,
      lastRestock: '12/05/2025',
      location: 'Geladeira',
      status: 'normal',
      urgencyLevel: 'none'
    },
    {
      id: 5,
      name: 'Água Mineral',
      category: 'Bebidas',
      type: 'resale',
      unit: 'un',
      quantity: 36,
      minQuantity: 20,
      costPerUnit: 1.20,
      salePrice: 3.00,
      totalValue: 43.20,
      lastRestock: '12/05/2025',
      location: 'Geladeira',
      status: 'normal',
      urgencyLevel: 'none'
    },
    {
      id: 6,
      name: 'Leite',
      category: 'Ingredientes',
      type: 'ingredients',
      unit: 'L',
      quantity: 15,
      minQuantity: 20,
      costPerUnit: 4.80,
      totalValue: 72,
      lastRestock: '14/05/2025',
      location: 'Refrigerado',
      status: 'low',
      urgencyLevel: 'high'
    },
    {
      id: 7,
      name: 'Salgadinho',
      category: 'Snacks',
      type: 'resale',
      unit: 'un',
      quantity: 25,
      minQuantity: 10,
      costPerUnit: 2.50,
      salePrice: 4.50,
      totalValue: 62.50,
      lastRestock: '05/05/2025',
      location: 'Prateleira',
      status: 'normal',
      urgencyLevel: 'none'
    },
  ];

  useEffect(() => {
    // Initialize restockItems with items that are below minimum quantity
    prepareRestockItems();
  }, []);

  const prepareRestockItems = () => {
    const itemsToRestock = inventoryItems.filter(item => item.quantity <= item.minQuantity);
    setRestockItems(itemsToRestock);
    
    // Initialize quantity to purchase with recommended values
    const initialQuantities: Record<number, number> = {};
    itemsToRestock.forEach(item => {
      // Calculate recommended quantity to purchase (bring stock level to 150% of minimum)
      const recommendedQuantity = Math.ceil(item.minQuantity * 1.5 - item.quantity);
      initialQuantities[item.id] = recommendedQuantity > 0 ? recommendedQuantity : 0;
    });
    setQuantityToPurchase(initialQuantities);
  };

  const filteredItems = inventoryType === 'all' 
    ? inventoryItems 
    : inventoryItems.filter(item => item.type === inventoryType);

  const searchedItems = searchQuery
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredItems;

  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = filteredItems.filter(item => item.status === 'low').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'badge-success';
      case 'low':
        return 'badge-warning';
      case 'out':
        return 'badge-error';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getUrgencyLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <span className="badge bg-red-100 text-red-800">Alta</span>;
      case 'medium':
        return <span className="badge bg-yellow-100 text-yellow-800">Média</span>;
      case 'low':
        return <span className="badge bg-blue-100 text-blue-800">Baixa</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-600">Nenhuma</span>;
    }
  };

  // Function to determine urgency level based on stock level compared to minimum
  const calculateUrgencyLevel = (item: InventoryItem) => {
    if (item.quantity === 0) return 'high';
    if (item.quantity <= item.minQuantity * 0.5) return 'high';
    if (item.quantity <= item.minQuantity * 0.8) return 'medium';
    if (item.quantity <= item.minQuantity) return 'low';
    return 'none';
  };

  const calculateTotalRestockValue = () => {
    return restockItems.reduce((total, item) => {
      const quantityToBuy = quantityToPurchase[item.id] || 0;
      return total + (quantityToBuy * item.costPerUnit);
    }, 0);
  };

  // Export functions
  const exportToExcel = (items: InventoryItem[]) => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    
    const exportData = items.map(item => ({
      'Código': item.id,
      'Produto': item.name,
      'Categoria': item.category,
      'Quantidade Atual': item.quantity,
      'Quantidade Mínima': item.minQuantity,
      'Quantidade a Comprar': quantityToPurchase[item.id] || 0,
      'Unidade': item.unit,
      'Custo Unitário': item.costPerUnit.toFixed(2),
      'Valor Total': ((quantityToPurchase[item.id] || 0) * item.costPerUnit).toFixed(2),
      'Urgência': item.quantity === 0 ? 'Alta' : 
                 item.quantity <= item.minQuantity * 0.5 ? 'Alta' : 
                 item.quantity <= item.minQuantity * 0.8 ? 'Média' : 'Baixa'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reabastecimento');
    
    // Add a summary row
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['', '', '', '', '', '', '', 'TOTAL:', `R$ ${calculateTotalRestockValue().toFixed(2)}`]
    ], { origin: -1 });
    
    // Auto-size columns
    const colWidths = exportData.reduce((widths: number[], row) => {
      Object.keys(row).forEach((key, i) => {
        const length = String(row[key as keyof typeof row]).length;
        widths[i] = Math.max(widths[i] || 0, length, key.length);
      });
      return widths;
    }, []);
    
    worksheet['!cols'] = colWidths.map(width => ({ width }));
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, 'lista_reabastecimento' + fileExtension);
  };

  const exportToPDF = (items: InventoryItem[]) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Lista de Reabastecimento', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
    
    // Prepare table data
    const tableColumn = [
      'Código', 'Produto', 'Qtd. Atual', 'Qtd. Mínima', 
      'Qtd. Comprar', 'Un.', 'Custo Un.', 'Total', 'Urgência'
    ];
    const tableRows = items.map(item => [
      item.id,
      item.name,
      item.quantity,
      item.minQuantity,
      quantityToPurchase[item.id] || 0,
      item.unit,
      `R$ ${item.costPerUnit.toFixed(2)}`,
      `R$ ${((quantityToPurchase[item.id] || 0) * item.costPerUnit).toFixed(2)}`,
      item.quantity === 0 ? 'Alta' : 
      item.quantity <= item.minQuantity * 0.5 ? 'Alta' : 
      item.quantity <= item.minQuantity * 0.8 ? 'Média' : 'Baixa'
    ]);
    
    // Add summary row
    tableRows.push([
      '', 'TOTAL', '', '', '', '', '', 
      `R$ ${calculateTotalRestockValue().toFixed(2)}`, ''
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 10 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 }
      }
    });
    
    // Save the PDF
    doc.save('lista_reabastecimento.pdf');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-500">Gerenciamento de produtos para revenda e ingredientes</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowRestockModal(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Reabastecer
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Itens em Estoque</h3>
              <p className="text-2xl font-bold text-gray-900">{filteredItems.length} itens</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
              <BarChart2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor Total em Estoque</h3>
              <p className="text-2xl font-bold text-gray-900">R$ {totalValue.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-yellow-50 border border-yellow-100">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Estoque Baixo</h3>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount} itens</p>
              <p className="text-sm text-yellow-600 mt-1">Reabastecer em breve</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${inventoryType === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setInventoryType('all')}
          >
            Todos
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${inventoryType === 'resale' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setInventoryType('resale')}
          >
            Revenda
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${inventoryType === 'ingredients' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setInventoryType('ingredients')}
          >
            Ingredientes
          </button>
        </div>
        
        <div className="flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Buscar item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button className="btn-outline">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container animate-slide-up">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-th">Nome</th>
              <th className="table-th">Categoria</th>
              <th className="table-th">Quantidade</th>
              <th className="table-th">Un.</th>
              <th className="table-th">Custo Un.</th>
              {inventoryType === 'resale' && <th className="table-th">Preço Un.</th>}
              <th className="table-th">Valor Total</th>
              <th className="table-th">Status</th>
              <th className="table-th">Localização</th>
              <th className="table-th">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {searchedItems.map((item) => (
              <tr key={item.id} className="table-row">
                <td className="table-td font-medium text-gray-900">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      {item.type === 'ingredients' ? (
                        <Layers className="h-4 w-4 text-primary" />
                      ) : (
                        <Package className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    {item.name}
                  </div>
                </td>
                <td className="table-td">{item.category}</td>
                <td className="table-td">
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      item.quantity <= item.minQuantity ? 'text-orange-600' : 'text-gray-900'
                    }`}>{item.quantity}</span>
                    <span className="text-xs text-gray-500 ml-2">Min: {item.minQuantity}</span>
                  </div>
                </td>
                <td className="table-td">{item.unit}</td>
                <td className="table-td">R$ {item.costPerUnit.toFixed(2)}</td>
                {inventoryType === 'resale' && item.salePrice && (
                  <td className="table-td">R$ {item.salePrice.toFixed(2)}</td>
                )}
                <td className="table-td font-medium">R$ {item.totalValue.toFixed(2)}</td>
                <td className="table-td">
                  <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status === 'normal' ? 'Normal' : 
                     item.status === 'low' ? 'Baixo' : 
                     item.status === 'out' ? 'Esgotado' : item.status}
                  </span>
                </td>
                <td className="table-td">{item.location}</td>
                <td className="table-td">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Low Stock Alert Section */}
      {lowStockCount > 0 && (
        <div className="card bg-yellow-50 border border-yellow-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Estoque Baixo</h3>
          
          <div className="space-y-4">
            {filteredItems.filter(item => item.status === 'low').map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-lg border border-yellow-100 animate-slide-in">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Estoque atual: <span className="text-yellow-600 font-medium">{item.quantity} {item.unit}</span> (mínimo: {item.minQuantity} {item.unit})
                    </p>
                  </div>
                </div>
                <button 
                  className="btn-primary text-sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setRestockItems([item]);
                    setQuantityToPurchase({
                      [item.id]: Math.ceil(item.minQuantity * 1.5 - item.quantity)
                    });
                    setShowRestockModal(true);
                  }}
                >
                  Reabastecer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full overflow-hidden">
            <div className="p-6 bg-gray-100 flex justify-between items-center border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Lista de Reabastecimento
              </h3>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-700">
                    Esta lista inclui itens com estoque abaixo do mínimo configurado. 
                    Ajuste as quantidades conforme necessário.
                  </p>
                  <div className="flex items-center">
                    <button 
                      className="text-primary hover:text-primary-dark mr-2 text-sm font-medium flex items-center"
                      onClick={() => prepareRestockItems()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>

              {/* Restock items table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Atual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Mínima</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. a Comprar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgência</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restockItems.map((item) => {
                      const urgencyLevel = calculateUrgencyLevel(item);
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #{item.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${item.quantity < item.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.minQuantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              className="input py-1 px-2 w-24 text-center"
                              value={quantityToPurchase[item.id] || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setQuantityToPurchase(prev => ({
                                  ...prev,
                                  [item.id]: value >= 0 ? value : 0
                                }));
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {item.costPerUnit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {((quantityToPurchase[item.id] || 0) * item.costPerUnit).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUrgencyLevelBadge(urgencyLevel)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        R$ {calculateTotalRestockValue().toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty state */}
              {restockItems.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Tudo em ordem!</h3>
                  <p className="text-gray-600">
                    Não há itens que necessitem de reabastecimento no momento.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-700 mr-4">
                  Total de itens: <strong>{restockItems.length}</strong>
                </span>
                <span className="text-sm text-gray-700">
                  Valor total: <strong>R$ {calculateTotalRestockValue().toFixed(2)}</strong>
                </span>
              </div>
              <div className="flex space-x-4">
                <div className="dropdown relative">
                  <button className="btn-outline flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="dropdown-menu absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg hidden">
                    <button
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" 
                      onClick={() => exportToExcel(restockItems)}
                    >
                      Exportar para Excel
                    </button>
                    <button
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => exportToPDF(restockItems)}
                    >
                      Exportar para PDF
                    </button>
                  </div>
                </div>
                <button 
                  className="btn-outline"
                  onClick={() => setShowRestockModal(false)}
                >
                  Cancelar
                </button>
                <button className="btn-primary">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Criar Pedido de Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;