import React, { useEffect } from 'react';
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import useDebts from '../../hooks/useDebts';

const DebtSummary: React.FC = () => {
  const { 
    summary, 
    fetchDebtSummary, 
    isLoading 
  } = useDebts();

  useEffect(() => {
    fetchDebtSummary();
  }, [fetchDebtSummary]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const COLORS = [
    '#4F46E5', '#10B981', '#F97316', '#EC4899', 
    '#8B5CF6', '#06B6D4', '#F43F5E', '#14B8A6'
  ];

  // Prepare data for category pie chart
  const categoryData = summary.by_category.map(cat => ({
    name: cat.category_name,
    value: cat.total_amount
  }));

  // Prepare data for status distribution
  const statusData = [
    { name: 'Pendente', value: summary.pending_amount },
    { name: 'Atrasada', value: summary.overdue_amount },
    { name: 'Paga', value: summary.paid_amount }
  ];

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Dívidas</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_amount)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pendente</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pending_amount)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pago</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.paid_amount)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Atrasado</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.overdue_amount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribution by Category */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Dívidas por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution by Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Situação das Dívidas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={statusData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill="#4F46E5">
                  <Cell fill="#3B82F6" /> {/* Pendente - Blue */}
                  <Cell fill="#EF4444" /> {/* Atrasada - Red */}
                  <Cell fill="#10B981" /> {/* Paga - Green */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtSummary;