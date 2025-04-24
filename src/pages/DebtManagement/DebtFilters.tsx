import React, { useState, useEffect } from 'react';
import { DebtFilterOptions, DebtCategory, DebtStatus } from '../../types/debt';
import { X, Calendar, DollarSign, Tag, Filter } from 'lucide-react';

interface DebtFiltersProps {
  categories: DebtCategory[];
  filters: DebtFilterOptions;
  onApplyFilters: (filters: DebtFilterOptions) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

const DebtFilters: React.FC<DebtFiltersProps> = ({ 
  categories, 
  filters, 
  onApplyFilters, 
  onClearFilters,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<DebtFilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setLocalFilters({
        ...localFilters,
        [name]: value === '' ? undefined : parseFloat(value),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        [name]: value,
      });
    }
  };

  const handleStatusChange = (status: DebtStatus) => {
    let newStatuses: DebtStatus[] = localFilters.status ? [...localFilters.status] : [];

    if (newStatuses.includes(status)) {
      newStatuses = newStatuses.filter(s => s !== status);
    } else {
      newStatuses.push(status);
    }

    setLocalFilters({
      ...localFilters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    let newCategories: string[] = localFilters.category_ids ? [...localFilters.category_ids] : [];

    if (newCategories.includes(categoryId)) {
      newCategories = newCategories.filter(id => id !== categoryId);
    } else {
      newCategories.push(categoryId);
    }

    setLocalFilters({
      ...localFilters,
      category_ids: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    onClearFilters();
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-500"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-6">
          {/* Status filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  id="status-pending"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('pending') || false}
                  onChange={() => handleStatusChange('pending')}
                />
                <label htmlFor="status-pending" className="ml-2 text-sm text-gray-700">
                  Pendente
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="status-partial"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('partial') || false}
                  onChange={() => handleStatusChange('partial')}
                />
                <label htmlFor="status-partial" className="ml-2 text-sm text-gray-700">
                  Parcial
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="status-paid"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('paid') || false}
                  onChange={() => handleStatusChange('paid')}
                />
                <label htmlFor="status-paid" className="ml-2 text-sm text-gray-700">
                  Pago
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="status-overdue"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('overdue') || false}
                  onChange={() => handleStatusChange('overdue')}
                />
                <label htmlFor="status-overdue" className="ml-2 text-sm text-gray-700">
                  Atrasado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="status-renegotiated"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('renegotiated') || false}
                  onChange={() => handleStatusChange('renegotiated')}
                />
                <label htmlFor="status-renegotiated" className="ml-2 text-sm text-gray-700">
                  Renegociado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="status-cancelled"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={localFilters.status?.includes('cancelled') || false}
                  onChange={() => handleStatusChange('cancelled')}
                />
                <label htmlFor="status-cancelled" className="ml-2 text-sm text-gray-700">
                  Cancelado
                </label>
              </div>
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Período de Vencimento</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="start_date" className="block text-xs text-gray-500 mb-1">
                  De
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    className="w-full py-2 pl-8 pr-2 border border-gray-300 rounded-md text-sm"
                    value={localFilters.start_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="end_date" className="block text-xs text-gray-500 mb-1">
                  Até
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className="w-full py-2 pl-8 pr-2 border border-gray-300 rounded-md text-sm"
                    value={localFilters.end_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Value range filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Faixa de Valor</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="min_amount" className="block text-xs text-gray-500 mb-1">
                  De
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="min_amount"
                    name="min_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full py-2 pl-8 pr-2 border border-gray-300 rounded-md text-sm"
                    value={localFilters.min_amount !== undefined ? localFilters.min_amount : ''}
                    onChange={handleInputChange}
                    placeholder="Min"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="max_amount" className="block text-xs text-gray-500 mb-1">
                  Até
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="max_amount"
                    name="max_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full py-2 pl-8 pr-2 border border-gray-300 rounded-md text-sm"
                    value={localFilters.max_amount !== undefined ? localFilters.max_amount : ''}
                    onChange={handleInputChange}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Categorias</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto pb-1">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    id={`category-${category.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                    checked={localFilters.category_ids?.includes(category.id) || false}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ordenar por</h4>
            <select
              name="sort_by"
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm"
              value={localFilters.sort_by || 'due_date'}
              onChange={handleInputChange}
            >
              <option value="due_date">Data de Vencimento</option>
              <option value="amount">Valor</option>
              <option value="debtor_name">Nome do Devedor</option>
              <option value="created_at">Data de Criação</option>
              <option value="status">Status</option>
            </select>
            
            <div className="flex mt-2 space-x-2">
              <div className="flex items-center">
                <input
                  id="sort-asc"
                  type="radio"
                  name="sort_direction"
                  value="asc"
                  className="h-4 w-4 text-primary border-gray-300"
                  checked={localFilters.sort_direction === 'asc' || !localFilters.sort_direction}
                  onChange={handleInputChange}
                />
                <label htmlFor="sort-asc" className="ml-2 text-sm text-gray-700">
                  Crescente
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="sort-desc"
                  type="radio"
                  name="sort_direction"
                  value="desc"
                  className="h-4 w-4 text-primary border-gray-300"
                  checked={localFilters.sort_direction === 'desc'}
                  onChange={handleInputChange}
                />
                <label htmlFor="sort-desc" className="ml-2 text-sm text-gray-700">
                  Decrescente
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50 flex justify-between">
        <button
          type="button"
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          onClick={handleClear}
        >
          Limpar Filtros
        </button>
        <button
          type="button"
          className="btn-primary py-1 px-4 text-sm"
          onClick={handleApply}
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default DebtFilters;