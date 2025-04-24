import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft,
  ArrowUpDown,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Tag,
  Barcode,
  Image,
  FileText,
  ShoppingCart,
  Percent,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Factory,
  ShoppingBag
} from 'lucide-react';

const ProductManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['all']);
  const [productView, setProductView] = useState<'list' | 'details'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'resale' | 'own_production' | 'raw_material'>('all');

  // Sample product categories
  const categories = [
    { id: 'all', name: 'Todos os Produtos', count: 125 },
    { id: 'food', name: 'Alimentos', count: 45 },
    { id: 'drinks', name: 'Bebidas', count: 32 },
    { id: 'hygiene', name: 'Higiene e Limpeza', count: 28 },
    { id: 'other', name: 'Outros', count: 20 }
  ];

  // Sample product data
  const products = [
    {
      id: 1,
      name: 'Arroz Integral',
      sku: 'ARRZ001',
      barcode: '7891234567890',
      category: 'food',
      productType: 'resale',
      price: 12.90,
      costPrice: 9.50,
      stock: 35,
      minStock: 10,
      unit: 'kg',
      status: 'active',
      lastUpdate: '15/05/2025',
      fiscal: {
        ncm: '10063011',
        cest: '1700100',
        origin: '0',
        icms: 7,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 2,
      name: 'Café Premium',
      sku: 'CAFE001',
      barcode: '7891234567891',
      category: 'food',
      productType: 'resale',
      price: 24.50,
      costPrice: 18.75,
      stock: 28,
      minStock: 15,
      unit: 'kg',
      status: 'active',
      lastUpdate: '14/05/2025',
      fiscal: {
        ncm: '09011110',
        cest: '1700700',
        origin: '0',
        icms: 12,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 3,
      name: 'Refrigerante Cola',
      sku: 'REFR001',
      barcode: '7891234567892',
      category: 'drinks',
      productType: 'resale',
      price: 8.99,
      costPrice: 6.50,
      stock: 48,
      minStock: 20,
      unit: 'un',
      status: 'active',
      lastUpdate: '10/05/2025',
      fiscal: {
        ncm: '22021000',
        cest: '0300100',
        origin: '0',
        icms: 18,
        ipi: 4,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 4,
      name: 'Detergente',
      sku: 'LIMP001',
      barcode: '7891234567893',
      category: 'hygiene',
      productType: 'resale',
      price: 3.49,
      costPrice: 2.10,
      stock: 52,
      minStock: 25,
      unit: 'un',
      status: 'active',
      lastUpdate: '12/05/2025',
      fiscal: {
        ncm: '34022000',
        cest: '2004900',
        origin: '0',
        icms: 18,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 5,
      name: 'Água Mineral',
      sku: 'AGUA001',
      barcode: '7891234567894',
      category: 'drinks',
      productType: 'resale',
      price: 2.99,
      costPrice: 1.85,
      stock: 8,
      minStock: 12,
      unit: 'un',
      status: 'low',
      lastUpdate: '13/05/2025',
      fiscal: {
        ncm: '22011000',
        cest: '0300200',
        origin: '0',
        icms: 18,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 6,
      name: 'Pão Francês',
      sku: 'PAO001',
      barcode: '7891234567895',
      category: 'food',
      productType: 'own_production',
      price: 0.75,
      costPrice: 0.25,
      stock: 120,
      minStock: 30,
      unit: 'un',
      status: 'active',
      lastUpdate: '15/05/2025',
      fiscal: {
        ncm: '19052090',
        cest: '1702100',
        origin: '0',
        icms: 7,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 7,
      name: 'Bolo de Chocolate',
      sku: 'BOLO001',
      barcode: '7891234567896',
      category: 'food',
      productType: 'own_production',
      price: 35.00,
      costPrice: 12.50,
      stock: 8,
      minStock: 5,
      unit: 'un',
      status: 'active',
      lastUpdate: '15/05/2025',
      fiscal: {
        ncm: '19059090',
        cest: '1702900',
        origin: '0',
        icms: 7,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    },
    {
      id: 8,
      name: 'Farinha de Trigo',
      sku: 'MTRE001',
      barcode: '7891234567897',
      category: 'food',
      productType: 'raw_material',
      price: 4.50,
      costPrice: 3.20,
      stock: 75,
      minStock: 25,
      unit: 'kg',
      status: 'active',
      lastUpdate: '13/05/2025',
      fiscal: {
        ncm: '11010010',
        cest: '1701700',
        origin: '0',
        icms: 7,
        ipi: 0,
        pis: 1.65,
        cofins: 7.60,
        taxSituation: 'Tributado'
      }
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(current => 
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setProductView('details');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Ativo</span>;
      case 'inactive':
        return <span className="badge badge-error">Inativo</span>;
      case 'low':
        return <span className="badge badge-warning">Baixo Estoque</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
    }
  };
  
  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'resale':
        return 'Produto de Revenda';
      case 'own_production':
        return 'Produção Própria';
      case 'raw_material':
        return 'Matéria-Prima';
      default:
        return type;
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'resale':
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case 'own_production':
        return <Factory className="h-4 w-4 text-green-600" />;
      case 'raw_material':
        return <Package className="h-4 w-4 text-amber-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'resale':
        return <span className="badge bg-blue-100 text-blue-600 font-medium">Revenda</span>;
      case 'own_production':
        return <span className="badge bg-green-100 text-green-600 font-medium">Produção Própria</span>;
      case 'raw_material':
        return <span className="badge bg-amber-100 text-amber-600 font-medium">Matéria-Prima</span>;
      default:
        return null;
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.includes(searchQuery) ||
        product.barcode.includes(searchQuery)
      );
    }
    
    // Filter by expanded category (if not "all")
    if (!expandedCategories.includes('all')) {
      filtered = filtered.filter(product => 
        expandedCategories.some(cat => product.category === cat)
      );
    }

    // Filter by product type
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => product.productType === productTypeFilter);
    }
    
    return filtered;
  };

  const filteredProducts = filterProducts();

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
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-500">Gerencie o cadastro de produtos</p>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowAddProduct(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Product Type Filter */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${productTypeFilter === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setProductTypeFilter('all')}
        >
          Todos
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${productTypeFilter === 'resale' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setProductTypeFilter('resale')}
        >
          <ShoppingBag className="h-4 w-4 mr-1 inline" />
          Produtos de Revenda
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${productTypeFilter === 'own_production' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setProductTypeFilter('own_production')}
        >
          <Factory className="h-4 w-4 mr-1 inline" />
          Produção Própria
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${productTypeFilter === 'raw_material' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setProductTypeFilter('raw_material')}
        >
          <Package className="h-4 w-4 mr-1 inline" />
          Matéria-Prima
        </button>
      </div>

      {productView === 'list' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Categories Panel */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <div 
                    key={category.id}
                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${
                      expandedCategories.includes(category.id) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center">
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">{category.count}</span>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="text-primary text-sm font-medium w-full text-center">
                  + Adicionar Categoria
                </button>
              </div>
            </div>
          </div>

          {/* Products Panel */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Buscar por nome, SKU ou código de barras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button className="btn-outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Ordenar
              </button>
            </div>

            {/* Products Table */}
            <div className="table-container animate-slide-in">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">Produto</th>
                    <th className="table-th">Tipo</th>
                    <th className="table-th">SKU / Cód. Barras</th>
                    <th className="table-th">Categoria</th>
                    <th className="table-th">Preço</th>
                    <th className="table-th">Estoque</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="table-td font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="table-td">
                        {getProductTypeBadge(product.productType)}
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col">
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.sku}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Barcode className="h-3 w-3 mr-1" />
                            {product.barcode}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        {getCategoryLabel(product.category)}
                      </td>
                      <td className="table-td font-medium">
                        R$ {product.price.toFixed(2)}
                        <div className="text-xs text-gray-500">
                          Custo: R$ {product.costPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col">
                          <div className={`font-medium ${product.stock < product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock} {product.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Mín: {product.minStock} {product.unit}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
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
          </div>
        </div>
      ) : (
        <>
          {/* Product Details View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Info Card */}
            <div className="card lg:col-span-1">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações do Produto</h3>
                <button className="text-primary hover:text-primary-dark">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <Image className="h-16 w-16 text-gray-400" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{selectedProduct?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Produto</p>
                  <div className="flex items-center mt-1">
                    {getProductTypeIcon(selectedProduct?.productType)}
                    <p className="ml-2">{getProductTypeLabel(selectedProduct?.productType)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-medium">{selectedProduct?.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Código de Barras</p>
                    <p className="font-medium">{selectedProduct?.barcode}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-medium">{getCategoryLabel(selectedProduct?.category)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Preço de Venda</p>
                    <p className="font-medium">R$ {selectedProduct?.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preço de Custo</p>
                    <p className="font-medium">R$ {selectedProduct?.costPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedProduct?.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Additional Info */}
            <div className="card lg:col-span-2">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Estoque e Vendas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Informações de Estoque</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantidade atual:</span>
                      <span className="font-medium">{selectedProduct?.stock} {selectedProduct?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantidade mínima:</span>
                      <span className="font-medium">{selectedProduct?.minStock} {selectedProduct?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor em estoque:</span>
                      <span className="font-medium">R$ {(selectedProduct?.stock * selectedProduct?.costPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Última atualização:</span>
                      <span className="font-medium">{selectedProduct?.lastUpdate}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="btn-outline w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajustar Estoque
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Informações Fiscais</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">NCM:</span>
                      <span className="font-medium">{selectedProduct?.fiscal.ncm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CEST:</span>
                      <span className="font-medium">{selectedProduct?.fiscal.cest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Origem:</span>
                      <span className="font-medium">
                        {selectedProduct?.fiscal.origin === '0' ? '0 - Nacional' : 
                         selectedProduct?.fiscal.origin === '1' ? '1 - Estrangeira (Importação direta)' : 
                         selectedProduct?.fiscal.origin === '2' ? '2 - Estrangeira (Adquirida no mercado interno)' : 
                         selectedProduct?.fiscal.origin}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Situação Tributária:</span>
                      <span className="font-medium">{selectedProduct?.fiscal.taxSituation}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="btn-outline w-full">
                      <Info className="h-4 w-4 mr-2" />
                      Detalhes Tributários
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Alíquotas de Impostos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">ICMS</div>
                    <div className="text-xl font-bold text-blue-700">{selectedProduct?.fiscal.icms}%</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">IPI</div>
                    <div className="text-xl font-bold text-green-700">{selectedProduct?.fiscal.ipi}%</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">PIS</div>
                    <div className="text-xl font-bold text-purple-700">{selectedProduct?.fiscal.pis}%</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">COFINS</div>
                    <div className="text-xl font-bold text-amber-700">{selectedProduct?.fiscal.cofins}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Histórico de Movimentações</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responsável
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          15/05/2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge bg-green-100 text-green-600">Entrada</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          +15 {selectedProduct?.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          João Silva
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          14/05/2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge bg-red-100 text-red-600">Saída</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          -5 {selectedProduct?.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Sistema
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          12/05/2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge bg-blue-100 text-blue-600">Ajuste</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          +2 {selectedProduct?.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Maria Oliveira
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              className="btn-outline"
              onClick={() => setProductView('list')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </button>
            
            <div className="flex space-x-3">
              <button className="btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Etiqueta
              </button>
              <button className="btn-primary">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar à Venda
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Novo Produto
              </h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-6">
              {/* Basic Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Informações Básicas</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Produto *
                    </label>
                    <select className="select" required>
                      <option value="">Selecione</option>
                      <option value="resale">Produto de Revenda</option>
                      <option value="own_production">Produção Própria</option>
                      <option value="raw_material">Matéria-Prima</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código (SKU) *
                      </label>
                      <input
                        type="text"
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de Barras
                      </label>
                      <input
                        type="text"
                        className="input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select className="select" required>
                        <option value="">Selecione</option>
                        <option value="food">Alimentos</option>
                        <option value="drinks">Bebidas</option>
                        <option value="hygiene">Higiene e Limpeza</option>
                        <option value="other">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade *
                      </label>
                      <select className="select" required>
                        <option value="">Selecione</option>
                        <option value="un">Unidade (un)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="l">Litro (l)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="pct">Pacote (pct)</option>
                      </select>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Pricing Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Preço e Estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Custo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Atual *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Margem de Lucro (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      disabled
                      placeholder="Calculado automaticamente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select className="select">
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fiscal Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Informações Fiscais</h4>
                  <div className="flex items-center text-xs text-blue-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Informações conformes à documentação contábil</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCM (Nomenclatura Comum do Mercosul) *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="00000000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEST (Código Especificador da Substituição Tributária)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="0000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origem *
                    </label>
                    <select className="select" required>
                      <option value="">Selecione</option>
                      <option value="0">0 - Nacional</option>
                      <option value="1">1 - Estrangeira - Importação direta</option>
                      <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                      <option value="3">3 - Nacional - Mercadoria com Conteúdo de Importação superior a 40%</option>
                      <option value="4">4 - Nacional - Produção conforme processos produtivos</option>
                      <option value="5">5 - Nacional - Mercadoria com Conteúdo de Importação inferior a 40%</option>
                      <option value="6">6 - Estrangeira - Importação direta, sem similar nacional</option>
                      <option value="7">7 - Estrangeira - Adquirida no mercado interno, sem similar nacional</option>
                      <option value="8">8 - Nacional - Mercadoria com Conteúdo de Importação superior a 70%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Situação Tributária *
                    </label>
                    <select className="select" required>
                      <option value="">Selecione</option>
                      <option value="Tributado">Tributado integralmente</option>
                      <option value="Tributado com redução de base">Tributado com redução de base de cálculo</option>
                      <option value="Isento">Isento ou não tributado</option>
                      <option value="Substituição Tributária">Substituição Tributária</option>
                      <option value="Monofásico">Monofásico</option>
                      <option value="ST do imposto retido">ST do imposto retido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CFOP Padrão
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="0000"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium text-gray-800 mb-3">Alíquotas de Impostos</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ICMS (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IPI (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PIS (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        COFINS (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;