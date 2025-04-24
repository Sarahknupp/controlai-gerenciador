import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Plus, 
  Filter, 
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileUp,
  DollarSign,
  Trash2,
  Edit,
  Check,
  Clock,
  AlertTriangle,
  X,
  BarChart2,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';
import { Debt, DebtStatus, DebtFilterOptions } from '../../types/debt';
import useDebts from '../../hooks/useDebts';
import DebtForm from './DebtForm';
import PaymentForm from './PaymentForm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DebtSummary from './DebtSummary';
import DebtFilters from './DebtFilters';
import DebtsList from './DebtsList';
import DebtTrends from './DebtTrends';

const DebtManagementPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [expandedDebtIds, setExpandedDebtIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'summary'>('list');
  const [filters, setFilters] = useState<DebtFilterOptions>({
    status: undefined,
    category_ids: undefined,
    start_date: undefined,
    end_date: undefined,
    search_term: '',
    sort_by: 'due_date',
    sort_direction: 'asc'
  });

  const { 
    debts,
    categories,
    isLoading,
    error,
    fetchDebts,
    createDebt,
    updateDebt,
    deleteDebt,
    registerPayment,
    fetchDebtSummary,
    exportToExcel,
    exportToPDF,
    formatStatus,
    getStatusColor
  } = useDebts();

  // Initial data fetch
  useEffect(() => {
    fetchDebts(filters);
    fetchDebtSummary();
  }, [fetchDebts, fetchDebtSummary, filters]);

  // Handle form submission for new/edit debt
  const handleDebtSubmit = async (formData: any) => {
    let success;
    
    if (selectedDebt) {
      // Update existing debt
      success = await updateDebt(selectedDebt.id, formData);
    } else {
      // Create new debt
      const result = await createDebt(formData);
      success = !!result;
    }
    
    if (success) {
      setShowAddForm(false);
      setSelectedDebt(null);
      fetchDebts(filters);
      fetchDebtSummary();
    }
  };

  // Handle payment registration
  const handlePaymentSubmit = async (paymentData: any) => {
    if (!selectedDebt) return;
    
    const result = await registerPayment(selectedDebt.id, paymentData);
    
    if (result) {
      setShowPaymentForm(false);
      setSelectedDebt(null);
      fetchDebts(filters);
      fetchDebtSummary();
    }
  };

  // Handle debt deletion
  const confirmDeleteDebt = (id: string) => {
    setDebtToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;
    
    const success = await deleteDebt(debtToDelete);
    
    if (success) {
      setShowDeleteConfirm(false);
      setDebtToDelete(null);
      fetchDebts(filters);
      fetchDebtSummary();
    }
  };

  // Toggle debt expansion in list view
  const toggleDebtExpansion = (debtId: string) => {
    setExpandedDebtIds(prevIds =>
      prevIds.includes(debtId)
        ? prevIds.filter(id => id !== debtId)
        : [...prevIds, debtId]
    );
  };

  // Export filtered data
  const handleExportExcel = () => {
    exportToExcel(debts);
  };

  const handleExportPDF = () => {
    exportToPDF(debts);
  };

  // Apply filters
  const applyFilters = (newFilters: DebtFilterOptions) => {
    setFilters({
      ...filters,
      ...newFilters
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search_term: '',
      sort_by: 'due_date',
      sort_direction: 'asc'
    });
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search_term: value
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Dívidas</h1>
          <p className="text-gray-500">Registre, organize e acompanhe suas dívidas e pagamentos</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <button
              className="btn-outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {Object.keys(filters).length > 2 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-white rounded-full flex items-center justify-center">
                  {Object.keys(filters).length - 2}
                </span>
              )}
            </button>
            
            {showFilters && (
              <DebtFilters
                categories={categories}
                filters={filters}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>
          
          <div className="relative group">
            <button className="btn-outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
              <div className="py-1">
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 inline mr-2" />
                  Exportar para Excel
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleExportPDF}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Exportar para PDF
                </button>
              </div>
            </div>
          </div>
          
          <button 
            className="btn-primary"
            onClick={() => {
              setSelectedDebt(null);
              setShowAddForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Dívida
          </button>
        </div>
      </div>

      {/* Dashboard view controls */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewMode('list')}
        >
          <FileText className="h-4 w-4 inline mr-1" />
          Lista
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'cards' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewMode('cards')}
        >
          <DollarSign className="h-4 w-4 inline mr-1" />
          Cartões
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'summary' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewMode('summary')}
        >
          <BarChart2 className="h-4 w-4 inline mr-1" />
          Resumo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, documento, descrição..."
          className="input pl-10"
          value={filters.search_term || ''}
          onChange={handleSearchChange}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Content based on view mode */}
      {!isLoading && (
        <>
          {viewMode === 'list' && (
            <DebtsList
              debts={debts}
              categories={categories}
              expandedDebtIds={expandedDebtIds}
              onToggleExpand={toggleDebtExpansion}
              onEdit={(debt) => {
                setSelectedDebt(debt);
                setShowAddForm(true);
              }}
              onDelete={confirmDeleteDebt}
              onRegisterPayment={(debt) => {
                setSelectedDebt(debt);
                setShowPaymentForm(true);
              }}
              formatStatus={formatStatus}
              getStatusColor={getStatusColor}
            />
          )}

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {debts.map((debt) => {
                const category = categories.find(c => c.id === debt.category_id);
                return (
                  <div 
                    key={debt.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{debt.debtor_name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(debt.status)}`}>
                          {formatStatus(debt.status)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Valor:</span>
                          <span className="font-medium">R$ {debt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Vencimento:</span>
                          <span className="font-medium">{new Date(debt.due_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Categoria:</span>
                          <span className="font-medium">{category?.name || '-'}</span>
                        </div>
                        {debt.description && (
                          <div className="pt-2 text-sm text-gray-600">
                            <div className="italic">{debt.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between">
                      <button 
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowPaymentForm(true);
                        }}
                      >
                        Pagar
                      </button>
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setShowAddForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => confirmDeleteDebt(debt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'summary' && (
            <>
              <DebtSummary />
              <DebtTrends />
            </>
          )}
        </>
      )}

      {/* No results state */}
      {!isLoading && debts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma dívida encontrada</h3>
          <p className="text-gray-500 mb-6">
            {Object.keys(filters).length > 2
              ? 'Nenhuma dívida corresponde aos filtros aplicados'
              : 'Registre sua primeira dívida para começar a acompanhar'}
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedDebt(null);
              setShowAddForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Nova Dívida
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDebt ? 'Editar Dívida' : 'Registrar Nova Dívida'}
              </h2>
            </div>
            
            <DebtForm 
              debt={selectedDebt}
              categories={categories}
              onSubmit={handleDebtSubmit}
              onCancel={() => {
                setShowAddForm(false);
                setSelectedDebt(null);
              }}
            />
          </div>
        </div>
      )}

      {showPaymentForm && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Registrar Pagamento</h2>
              <p className="text-sm text-gray-600 mt-1">
                Dívida: {selectedDebt.debtor_name} - R$ {selectedDebt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <PaymentForm 
              debt={selectedDebt}
              onSubmit={handlePaymentSubmit}
              onCancel={() => {
                setShowPaymentForm(false);
                setSelectedDebt(null);
              }}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirmar Exclusão</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Atenção!</span>
                </div>
                <p>Tem certeza que deseja excluir esta dívida? Esta ação não poderá ser desfeita.</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="btn-outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDebtToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteDebt}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManagementPage;