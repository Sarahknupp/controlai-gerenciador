import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  FileText,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerView, setCustomerView] = useState<'list' | 'details'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Sample customer data
  const customers = [
    {
      id: 1,
      name: 'João Silva',
      type: 'individual',
      document: '123.456.789-00',
      phone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      address: 'Rua das Flores, 123, São Paulo - SP',
      status: 'active',
      totalPurchases: 1250.75,
      lastPurchase: '10/05/2025',
    },
    {
      id: 2,
      name: 'Maria Oliveira',
      type: 'individual',
      document: '987.654.321-00',
      phone: '(11) 91234-5678',
      email: 'maria.oliveira@email.com',
      address: 'Av. Paulista, 1000, São Paulo - SP',
      status: 'active',
      totalPurchases: 3420.50,
      lastPurchase: '15/05/2025',
    },
    {
      id: 3,
      name: 'Empresa ABC Ltda',
      type: 'company',
      document: '12.345.678/0001-90',
      phone: '(11) 3456-7890',
      email: 'contato@empresaabc.com.br',
      address: 'Rua Comercial, 500, São Paulo - SP',
      status: 'active',
      totalPurchases: 8750.25,
      lastPurchase: '12/05/2025',
    }
  ];

  // Sample purchases for selected customer
  const customerPurchases = [
    {
      id: 1,
      date: '15/05/2025',
      total: 125.50,
      items: 5,
      status: 'completed'
    },
    {
      id: 2,
      date: '10/05/2025',
      total: 87.25,
      items: 3,
      status: 'completed'
    },
    {
      id: 3,
      date: '02/05/2025',
      total: 215.80,
      items: 8,
      status: 'completed'
    }
  ];

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerView('details');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Ativo</span>;
      case 'inactive':
        return <span className="badge badge-error">Inativo</span>;
      case 'completed':
        return <span className="badge badge-success">Concluída</span>;
      case 'pending':
        return <span className="badge badge-warning">Pendente</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
    }
  };
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.document.includes(searchQuery)
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500">Gerencie o cadastro de clientes</p>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowAddCustomer(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {customerView === 'list' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Buscar por nome, CPF/CNPJ..."
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

          {/* Customers Table */}
          <div className="table-container animate-slide-in">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Nome</th>
                  <th className="table-th">CPF/CNPJ</th>
                  <th className="table-th">Contato</th>
                  <th className="table-th">Compras Totais</th>
                  <th className="table-th">Última Compra</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="table-row">
                    <td className="table-td font-medium text-gray-900">
                      {customer.name}
                      <div className="text-xs text-gray-500">
                        {customer.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </div>
                    </td>
                    <td className="table-td">{customer.document}</td>
                    <td className="table-td">
                      <div className="flex flex-col">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-medium">
                      R$ {customer.totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {customer.lastPurchase}
                      </div>
                    </td>
                    <td className="table-td">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => handleViewCustomer(customer)}
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
        </>
      ) : (
        <>
          {/* Customer Details View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info Card */}
            <div className="card lg:col-span-1">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações do Cliente</h3>
                <button className="text-primary hover:text-primary-dark">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{selectedCustomer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">
                    {selectedCustomer?.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer?.type === 'individual' ? 'CPF' : 'CNPJ'}
                  </p>
                  <p className="font-medium">{selectedCustomer?.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contato</p>
                  <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedCustomer?.phone}</p>
                  </div>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedCustomer?.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <div className="flex items-start mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                    <p>{selectedCustomer?.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedCustomer?.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer History */}
            <div className="card lg:col-span-2">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Compras</h3>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4">
                    Total: R$ {selectedCustomer?.totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Itens
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{String(purchase.id).padStart(5, '0')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.items} itens
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          R$ {purchase.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(purchase.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary hover:text-primary-dark">
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              className="btn-outline"
              onClick={() => setCustomerView('list')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </button>
            
            <div className="flex space-x-3">
              <button className="btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </button>
              <button className="btn-primary">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nova Venda
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Novo Cliente
              </h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-6">
              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cliente</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customerType"
                      value="individual"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      defaultChecked
                    />
                    <span className="ml-2 text-gray-700">Pessoa Física</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customerType"
                      value="company"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Pessoa Jurídica</span>
                  </label>
                </div>
              </div>
              
              {/* Basic Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Informações Básicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo / Razão Social *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF / CNPJ *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="000.000.000-00 / 00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RG / Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento / Fundação
                    </label>
                    <input
                      type="date"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Informações de Contato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone Secundário
                    </label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      className="input"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="00000-000"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      className="input"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select className="select" required>
                      <option value="">Selecione</option>
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddCustomer(false)}
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

export default CustomerManagement;