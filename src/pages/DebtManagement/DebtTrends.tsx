import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Brush
} from 'recharts';
import useDebts from '../../hooks/useDebts';

const DebtTrends: React.FC = () => {
  const { summary, fetchDebtSummary, isLoading } = useDebts();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDebtSummary();
  }, [fetchDebtSummary]);

  useEffect(() => {
    if (summary) {
      // Prepare data for the chart
      // Sort by month
      const sorted = [...summary.by_month].sort((a, b) => {
        const dateA = new Date(a.month.split(' ')[0] + ' 1, ' + a.month.split(' ')[1]);
        const dateB = new Date(b.month.split(' ')[0] + ' 1, ' + b.month.split(' ')[1]);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Format for the chart
      const chartData = sorted.map(item => ({
        name: item.month,
        value: item.amount
      }));
      
      setChartData(chartData);
    }
  }, [summary]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary || summary.by_month.length === 0) {
    return null;
  }

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendência de Dívidas por Período</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#4F46E5" 
              fill="#4F46E5" 
              fillOpacity={0.2} 
              name="Valor Total"
            />
            <Brush dataKey="name" height={30} stroke="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DebtTrends;