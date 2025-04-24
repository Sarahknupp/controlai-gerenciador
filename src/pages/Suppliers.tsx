import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Truck,
  Package,
  DollarSign,
  X,
  Building2,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  FileUp,
  Download,
  UploadCloud,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Supplier {
  id: number;
  name: string;
  corporateName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  cnpj: string;
  lastPurchase?: string;
  paymentTerms: string;
  status: string;
  notes?: string;
}

interface CNPJData {
  nome?: string;
  fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

const Suppliers: React.FC = () => {
  const [supplierCategory, setSupplierCategory] = useState<'all' | 'ingredients' | 'products' | 'services'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    category: 'ingredients',
    paymentTerms: '30 dias',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [cnpjLookupStatus, setCnpjLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);
  
  const suppliers = [
    {
      id: 1,
      name: 'Distribuidora de Farinhas ABC',
      corporateName: 'Distribuidora de Farinhas ABC Ltda',
      category: 'ingredients',
      contactName: 'Carlos Silva',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      email: 'carlos@farinhaabc.com.br',
      address: 'Rua das Indústrias, 123 - São Paulo/SP',
      lastPurchase: '10/05/2025',
      paymentTerms: '30 dias',
      status: 'active'
    },
    {
      id: 2,
      name: 'Laticínios do Vale',
      corporateName: 'Laticínios do Vale S.A.',
      category: 'ingredients',
      contactName: 'Amanda Santos',
      cnpj: '23.456.789/0001-12',
      phone: '(11) 97654-3210',
      email: 'amanda@laticiniosdovale.com.br',
      address: 'Estrada do Campo, 456 - Jundiaí/SP',
      lastPurchase: '08/05/2025',
      paymentTerms: '15 dias',
      status: 'active'
    },
    {
      id: 3,
      name: 'Bebidas Express',
      corporateName: 'Bebidas Express Comércio Ltda',
      category: 'products',
      contactName: 'Roberto Costa',
      cnpj: '34.567.890/0001-23',
      phone: '(11) 96543-2109',
      email: 'roberto@bebidasexpress.com.br',
      address: 'Av. dos Comércios, 789 - São Paulo/SP',
      lastPurchase: '12/05/2025',
      paymentTerms: '7 dias',
      status: 'active'
    },
    {
      id: 4,
      name: 'Equipamentos Industriais Silva',
      corporateName: 'Equipamentos Industriais Silva Ltda',
      category: 'services',
      contactName: 'Marcos Silva',
      cnpj: '45.678.901/0001-34',
      phone: '(11) 95432-1098',
      email: 'marcos@equipamentossilva.com.br',
      address: 'Rua das Máquinas, 321 - Guarulhos/SP',
      lastPurchase: '02/04/2025',
      paymentTerms: '45 dias',
      status: 'inactive'
    },
    {
      id: 5,
      name: 'Açúcar & Adoçantes Ltda',
      corporateName: 'Açúcar & Adoçantes Comércio Ltda',
      category: 'ingredients',
      contactName: 'Juliana Lima',
      cnpj: '56.789.012/0001-45',
      phone: '(11) 94321-0987',
      email: 'juliana@acucaradocantes.com.br',
      address: 'Rod. dos Produtores, 654 - Ribeirão Preto/SP',
      lastPurchase: '05/05/2025',
      paymentTerms: '30 dias',
      status: 'active'
    },
    {
      id: 6,
      name: 'Embalagens Express',
      corporateName: 'Embalagens Express Ind. e Com. Ltda',
      category: 'products',
      contactName: 'Paulo Souza',
      cnpj: '67.890.123/0001-56',
      phone: '(11) 93210-9876',
      email: 'paulo@embalagensexpress.com.br',
      address: 'Av. Industrial, 987 - Osasco/SP',
      lastPurchase: '01/05/2025',
      paymentTerms: '15 dias',
      status: 'active'
    },
  ];

  // CNPJ Validation
  const isValidCNPJ = (cnpj: string): boolean => {
    const stripped = cnpj.replace(/[^\d]/g, '');
    if (stripped.length !== 14) return false;
    
    // Simple validation - in a real app, use a proper CNPJ validation library
    return true;
  };

  // Format CNPJ 
  const formatCNPJ = (value: string): string => {
    const stripped = value.replace(/[^\d]/g, '');
    if (stripped.length <= 2) return stripped;
    if (stripped.length <= 5) return `${stripped.slice(0, 2)}.${stripped.slice(2)}`;
    if (stripped.length <= 8) return `${stripped.slice(0, 2)}.${stripped.slice(2, 5)}.${stripped.slice(5)}`;
    if (stripped.length <= 12) return `${stripped.slice(0, 2)}.${stripped.slice(2, 5)}.${stripped.slice(5, 8)}/${stripped.slice(8)}`;
    return `${stripped.slice(0, 2)}.${stripped.slice(2, 5)}.${stripped.slice(5, 8)}/${stripped.slice(8, 12)}-${stripped.slice(12, 14)}`;
  };

  const searchCNPJ = async (cnpj: string) => {
    try {
      setCnpjLookupStatus('loading');
      // Replace with your actual API endpoint
      const response = await fetch(`https://api.example.com/v1/cnpj/${cnpj.replace(/[^\d]/g, '')}`);
      
      if (!response.ok) {
        throw new Error('Falha ao consultar CNPJ');
      }
      
      const data: CNPJData = await response.json();
      
      // Auto-fill form data with the retrieved information
      setFormData(prev => ({
        ...prev,
        name: data.fantasia || '',
        corporateName: data.nome || '',
        address: `${data.logradouro || ''}, ${data.numero || ''} ${data.complemento ? `- ${data.complemento}` : ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}, ${data.cep || ''}`,
        phone: data.telefone || '',
        email: data.email || '',
        cnpj: cnpj
      }));
      
      setCnpjLookupStatus('success');
    } catch (error) {
      console.error('Error fetching CNPJ data:', error);
      setCnpjLookupStatus('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cnpj') {
      const formattedCNPJ = formatCNPJ(value);
      setFormData(prev => ({ ...prev, [name]: formattedCNPJ }));

      // Reset CNPJ lookup status if the input changes
      if (cnpjLookupStatus !== 'idle') {
        setCnpjLookupStatus('idle');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear the error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.cnpj || !isValidCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
    }
    
    if (!formData.corporateName || formData.corporateName.trim() === '') {
      errors.corporateName = 'Razão Social é obrigatória';
    }
    
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Nome Fantasia é obrigatório';
    }
    
    if (!formData.address || formData.address.trim() === '') {
      errors.address = 'Endereço é obrigatório';
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = 'Telefone é obrigatório';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.contactName || formData.contactName.trim() === '') {
      errors.contactName = 'Nome do Contato é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would save to your database here
      console.log('Form data to submit:', formData);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close the modal and reset form
      setIsModalOpen(false);
      setFormData({
        category: 'ingredients',
        paymentTerms: '30 dias',
        status: 'active'
      });
      setFormErrors({});
      setCnpjLookupStatus('idle');
      
      // Here you'd add the new supplier to state or trigger a refetch
      
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCNPJLookup = () => {
    if (formData.cnpj && formData.cnpj.replace(/[^\d]/g, '').length === 14) {
      searchCNPJ(formData.cnpj);
    } else {
      setFormErrors(prev => ({
        ...prev,
        cnpj: 'CNPJ inválido. Deve conter 14 dígitos.'
      }));
    }
  };

  const confirmDeleteSupplier = (id: number) => {
    setSupplierToDelete(id);
    setShowConfirmationModal(true);
  };

  const deleteSupplier = async () => {
    if (!supplierToDelete) return;
    
    try {
      // In a real app, you would delete from your database here
      console.log('Deleting supplier:', supplierToDelete);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you'd remove the supplier from state or trigger a refetch
      
      setShowConfirmationModal(false);
      setSupplierToDelete(null);
      
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const filteredSuppliers = supplierCategory === 'all' 
    ? suppliers 
    : suppliers.filter(supplier => supplier.category === supplierCategory);

  const searchedSuppliers = searchQuery
    ? filteredSuppliers.filter(
        supplier => 
          supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.corporateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.cnpj.includes(searchQuery)
      )
    : filteredSuppliers;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-error';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ingredients':
        return <Package className="h-4 w-4 text-primary" />;
      case 'products':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'services':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ingredients':
        return 'Ingredientes';
      case 'products':
        return 'Produtos';
      case 'services':
        return 'Serviços';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500">Gerenciamento de fornecedores e compras</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${supplierCategory === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSupplierCategory('all')}
          >
            Todos
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${supplierCategory === 'ingredients' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSupplierCategory('ingredients')}
          >
            Ingredientes
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${supplierCategory === 'products' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSupplierCategory('products')}
          >
            Produtos
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${supplierCategory === 'services' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSupplierCategory('services')}
          >
            Serviços
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
              placeholder="Buscar fornecedor por nome ou CNPJ..."
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
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container animate-slide-up">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-th">Fornecedor</th>
              <th className="table-th">CNPJ</th>
              <th className="table-th">Categoria</th>
              <th className="table-th">Contato</th>
              <th className="table-th">Última Compra</th>
              <th className="table-th">Prazo</th>
              <th className="table-th">Status</th>
              <th className="table-th">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {searchedSuppliers.map((supplier) => (
              <tr key={supplier.id} className="table-row">
                <td className="table-td font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span>{supplier.name}</span>
                    <span className="text-xs text-gray-500">{supplier.corporateName}</span>
                    <span className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {supplier.address}
                    </span>
                  </div>
                </td>
                <td className="table-td">
                  {supplier.cnpj}
                </td>
                <td className="table-td">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                      {getCategoryIcon(supplier.category)}
                    </div>
                    {getCategoryLabel(supplier.category)}
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex flex-col">
                    <span className="font-medium">{supplier.contactName}</span>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {supplier.phone}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {supplier.email}
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  {supplier.lastPurchase ? (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {supplier.lastPurchase}
                    </div>
                  ) : (
                    <span className="text-gray-400">Sem compras</span>
                  )}
                </td>
                <td className="table-td">{supplier.paymentTerms}</td>
                <td className="table-td">
                  <span className={`badge ${getStatusBadgeClass(supplier.status)}`}>
                    {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => confirmDeleteSupplier(supplier.id)}
                    >
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

      {/* Recent Orders */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Recentes</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-gray-50 rounded-lg animate-slide-in">
            <div className="flex items-center mb-3 md:mb-0">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Distribuidora de Farinhas ABC</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Pedido em 10/05/2025</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">50kg Farinha Trigo</span>
                <span className="text-sm font-medium">R$ 350,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">25kg Farinha Integral</span>
                <span className="text-sm font-medium">R$ 275,00</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span>R$ 625,00</span>
              </div>
            </div>
            <div className="mt-3 md:mt-0">
              <span className="badge badge-success">Entregue</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-gray-50 rounded-lg animate-slide-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center mb-3 md:mb-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Laticínios do Vale</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Pedido em 08/05/2025</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">30L Leite Integral</span>
                <span className="text-sm font-medium">R$ 180,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">10kg Cream Cheese</span>
                <span className="text-sm font-medium">R$ 240,00</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span>R$ 420,00</span>
              </div>
            </div>
            <div className="mt-3 md:mt-0">
              <span className="badge badge-success">Entregue</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-gray-50 rounded-lg animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center mb-3 md:mb-0">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Bebidas Express</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Pedido em 12/05/2025</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">48un Refrigerante Cola</span>
                <span className="text-sm font-medium">R$ 182,40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">36un Água Mineral</span>
                <span className="text-sm font-medium">R$ 43,20</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span>R$ 225,60</span>
              </div>
            </div>
            <div className="mt-3 md:mt-0">
              <span className="badge bg-blue-100 text-blue-600">A caminho</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-primary text-sm font-medium hover:text-primary-dark">
            Ver todos os pedidos
          </button>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Cadastro de Fornecedor</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* CNPJ Section with lookup */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                    CNPJ *
                  </label>
                  <div className="flex items-center text-xs">
                    {cnpjLookupStatus === 'success' && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        CNPJ encontrado
                      </div>
                    )}
                    {cnpjLookupStatus === 'error' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        CNPJ não encontrado
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleInputChange}
                      className={`input pr-10 ${formErrors.cnpj ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="00.000.000/0000-00"
                    />
                    {cnpjLookupStatus === 'loading' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    className="ml-2 btn-outline py-0 px-3"
                    onClick={handleCNPJLookup}
                    disabled={cnpjLookupStatus === 'loading'}
                  >
                    <RefreshCw className={`h-4 w-4 ${cnpjLookupStatus === 'loading' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {formErrors.cnpj && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.cnpj}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Digite o CNPJ completo para buscar automaticamente os dados da empresa</p>
              </div>

              {/* Company Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">Dados da Empresa</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="corporateName" className="block text-sm font-medium text-gray-700 mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      id="corporateName"
                      name="corporateName"
                      value={formData.corporateName || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.corporateName ? 'border-red-300' : ''}`}
                      placeholder="Nome completo da empresa conforme registro"
                    />
                    {formErrors.corporateName && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.corporateName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.name ? 'border-red-300' : ''}`}
                      placeholder="Nome comercial da empresa"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category || 'ingredients'}
                      onChange={handleInputChange}
                      className="select"
                    >
                      <option value="ingredients">Ingredientes</option>
                      <option value="products">Produtos</option>
                      <option value="services">Serviços</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço Completo *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.address ? 'border-red-300' : ''}`}
                      placeholder="Rua, número, bairro, cidade, UF, CEP"
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">Informações de Contato</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Contato *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.contactName ? 'border-red-300' : ''}`}
                      placeholder="Nome da pessoa de contato"
                    />
                    {formErrors.contactName && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.contactName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.phone ? 'border-red-300' : ''}`}
                      placeholder="(00) 00000-0000"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className={`input ${formErrors.email ? 'border-red-300' : ''}`}
                      placeholder="exemplo@empresa.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">Condições Comerciais</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                      Condição de Pagamento
                    </label>
                    <select
                      id="paymentTerms"
                      name="paymentTerms"
                      value={formData.paymentTerms || '30 dias'}
                      onChange={handleInputChange}
                      className="select"
                    >
                      <option value="à vista">À Vista</option>
                      <option value="7 dias">7 dias</option>
                      <option value="15 dias">15 dias</option>
                      <option value="30 dias">30 dias</option>
                      <option value="45 dias">45 dias</option>
                      <option value="60 dias">60 dias</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      className="input"
                      rows={3}
                      placeholder="Informações adicionais sobre este fornecedor"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status || 'active'}
                      onChange={handleInputChange}
                      className="select"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                type="button" 
                className="btn-outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  'Salvar Fornecedor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600 text-center mb-6">
                Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  className="btn-outline"
                  onClick={() => setShowConfirmationModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  onClick={deleteSupplier}
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;