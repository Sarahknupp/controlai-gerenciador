import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Debt, DebtFormData, DebtCategory, DebtStatus, DebtFilterOptions, DebtSummary, DebtPayment } from '../types/debt';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import FileSaver from 'file-saver';

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<DebtCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const { user } = useAuth();

  // Fetch all debts with optional filters
  const fetchDebts = useCallback(async (filters?: DebtFilterOptions) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('debts')
        .select(`
          *,
          debt_categories(id, name, color, icon)
        `)
        .is('deleted_at', null);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }

        if (filters.category_ids && filters.category_ids.length > 0) {
          query = query.in('category_id', filters.category_ids);
        }

        if (filters.start_date) {
          query = query.gte('due_date', filters.start_date);
        }

        if (filters.end_date) {
          query = query.lte('due_date', filters.end_date);
        }

        if (filters.min_amount !== undefined) {
          query = query.gte('amount', filters.min_amount);
        }

        if (filters.max_amount !== undefined) {
          query = query.lte('amount', filters.max_amount);
        }

        if (filters.debtors && filters.debtors.length > 0) {
          query = query.in('debtor_name', filters.debtors);
        }

        if (filters.search_term) {
          query = query.or(`debtor_name.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%,document_number.ilike.%${filters.search_term}%,notes.ilike.%${filters.search_term}%`);
        }

        // Apply sorting
        if (filters.sort_by) {
          const direction = filters.sort_direction || 'asc';
          query = query.order(filters.sort_by, { ascending: direction === 'asc' });
        } else {
          // Default sorting by due date
          query = query.order('due_date', { ascending: true });
        }

        // Apply pagination
        if (filters.page_size) {
          const page = filters.page || 1;
          const from = (page - 1) * filters.page_size;
          const to = from + filters.page_size - 1;
          query = query.range(from, to);
        }
      } else {
        // Default sorting
        query = query.order('due_date', { ascending: true });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDebts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dívidas';
      setError(errorMessage);
      console.error('Erro ao buscar dívidas:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch debt categories
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('debt_categories')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      
      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categorias';
      setError(errorMessage);
      console.error('Erro ao buscar categorias:', err);
    }
  }, [user]);

  // Create a new debt
  const createDebt = async (debtData: DebtFormData): Promise<Debt | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Process form data to match database schema
      const formattedData = {
        ...debtData,
        amount: typeof debtData.amount === 'string' ? parseFloat(debtData.amount) : debtData.amount,
        created_by: user.id,
        recurrence_info: debtData.recurring ? {
          ...debtData.recurrence_info,
          day: typeof debtData.recurrence_info?.day === 'string' ? 
            parseInt(debtData.recurrence_info.day) : debtData.recurrence_info?.day,
          times: typeof debtData.recurrence_info?.times === 'string' ? 
            parseInt(debtData.recurrence_info.times) : debtData.recurrence_info?.times
        } : null
      };

      const { data, error: insertError } = await supabase
        .from('debts')
        .insert(formattedData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Update local state
      setDebts(prevDebts => [...prevDebts, data]);
      
      // If it's a recurring debt, create future instances
      if (data.recurring && data.recurrence_info) {
        await createRecurringDebts(data);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar dívida';
      setError(errorMessage);
      console.error('Erro ao criar dívida:', err);
      return null;
    } finally {
      setIsLoading(false);
      fetchDebts(); // Refresh the debts list
    }
  };

  // Helper function to create recurring debts
  const createRecurringDebts = async (debt: Debt) => {
    if (!debt.recurring || !debt.recurrence_info || !user) return;
    
    const { frequency, times, end_date } = debt.recurrence_info;
    const baseDate = new Date(debt.due_date);
    const recurringDebts = [];
    
    // Determine how many instances to create
    const maxInstances = times || 
      (end_date ? calculateInstances(baseDate, new Date(end_date), frequency) : 12);
    
    // Create recurring instances (max 12 if no end date or times specified)
    for (let i = 1; i <= Math.min(maxInstances, 12); i++) {
      const newDueDate = calculateNextDate(baseDate, frequency, i);
      
      recurringDebts.push({
        debtor_name: debt.debtor_name,
        amount: debt.amount,
        due_date: newDueDate.toISOString().split('T')[0],
        category_id: debt.category_id,
        description: debt.description,
        status: 'pending',
        notes: debt.notes,
        document_number: debt.document_number,
        contact_info: debt.contact_info,
        payment_info: debt.payment_info,
        recurring: false, // Child debts are not recurring themselves
        created_by: user.id
      });
    }
    
    // Insert all recurring debts in batch
    if (recurringDebts.length > 0) {
      try {
        const { error } = await supabase
          .from('debts')
          .insert(recurringDebts);
          
        if (error) throw error;
      } catch (err) {
        console.error('Erro ao criar dívidas recorrentes:', err);
      }
    }
  };

  // Helper function to calculate the number of instances between dates
  const calculateInstances = (startDate: Date, endDate: Date, frequency: string): number => {
    const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 
      + (endDate.getMonth() - startDate.getMonth());
      
    switch (frequency) {
      case 'weekly':
        return Math.floor(diffInMonths * 4.33);
      case 'monthly':
        return diffInMonths;
      case 'quarterly':
        return Math.floor(diffInMonths / 3);
      case 'yearly':
        return Math.floor(diffInMonths / 12);
      default:
        return diffInMonths;
    }
  };

  // Helper function to calculate next date based on frequency
  const calculateNextDate = (baseDate: Date, frequency: string, increment: number): Date => {
    const result = new Date(baseDate);
    
    switch (frequency) {
      case 'weekly':
        result.setDate(result.getDate() + (7 * increment));
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + increment);
        break;
      case 'quarterly':
        result.setMonth(result.getMonth() + (3 * increment));
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + increment);
        break;
    }
    
    return result;
  };

  // Update an existing debt
  const updateDebt = async (id: string, debtData: Partial<DebtFormData>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Process form data to match database schema
      const formattedData: any = {
        ...debtData,
        updated_at: new Date().toISOString()
      };

      if (formattedData.amount && typeof formattedData.amount === 'string') {
        formattedData.amount = parseFloat(formattedData.amount);
      }

      if (formattedData.recurrence_info) {
        if (typeof formattedData.recurrence_info.day === 'string') {
          formattedData.recurrence_info.day = parseInt(formattedData.recurrence_info.day);
        }
        if (typeof formattedData.recurrence_info.times === 'string') {
          formattedData.recurrence_info.times = parseInt(formattedData.recurrence_info.times);
        }
      }

      const { error: updateError } = await supabase
        .from('debts')
        .update(formattedData)
        .eq('id', id)
        .eq('created_by', user.id);

      if (updateError) throw updateError;
      
      // Update local state
      setDebts(prevDebts => 
        prevDebts.map(debt => 
          debt.id === id ? { ...debt, ...formattedData } : debt
        )
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dívida';
      setError(errorMessage);
      console.error('Erro ao atualizar dívida:', err);
      return false;
    } finally {
      setIsLoading(false);
      fetchDebts(); // Refresh the debts list
    }
  };

  // Delete a debt (soft delete)
  const deleteDebt = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('debts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;
      
      // Update local state
      setDebts(prevDebts => prevDebts.filter(debt => debt.id !== id));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir dívida';
      setError(errorMessage);
      console.error('Erro ao excluir dívida:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a payment for a debt
  const registerPayment = async (
    debtId: string, 
    paymentData: {
      amount: number;
      payment_date: string;
      payment_method?: string;
      receipt_number?: string;
      notes?: string;
    }
  ): Promise<DebtPayment | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Format data
      const formattedData = {
        debt_id: debtId,
        ...paymentData,
        amount: typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount as unknown as string) : paymentData.amount,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('debt_payments')
        .insert(formattedData)
        .select()
        .single();

      if (error) throw error;
      
      // The trigger will update the debt status automatically
      fetchDebts(); // Refresh debts to get updated status

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar pagamento';
      setError(errorMessage);
      console.error('Erro ao registrar pagamento:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload an attachment for a debt
  const uploadAttachment = async (
    debtId: string,
    file: File,
    description?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload file to storage
      const filePath = `attachments/${debtId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('debt_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create record in database
      const { error: insertError } = await supabase
        .from('debt_attachments')
        .insert({
          debt_id: debtId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          description: description || '',
          created_by: user.id
        });

      if (insertError) throw insertError;

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do anexo';
      setError(errorMessage);
      console.error('Erro ao fazer upload do anexo:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get summary statistics
  const fetchDebtSummary = async (filters?: DebtFilterOptions): Promise<DebtSummary | null> => {
    if (!user) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Check if Supabase is properly initialized
      if (!supabase) {
        throw new Error('Conexão com o banco de dados não inicializada');
      }

      // Query parameters
      let query = supabase.from('debts').select('*').is('deleted_at', null);

      // Apply filters similar to fetchDebts
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }

        if (filters.category_ids && filters.category_ids.length > 0) {
          query = query.in('category_id', filters.category_ids);
        }

        if (filters.start_date) {
          query = query.gte('due_date', filters.start_date);
        }

        if (filters.end_date) {
          query = query.lte('due_date', filters.end_date);
        }

        if (filters.min_amount !== undefined) {
          query = query.gte('amount', filters.min_amount);
        }

        if (filters.max_amount !== undefined) {
          query = query.lte('amount', filters.max_amount);
        }

        if (filters.debtors && filters.debtors.length > 0) {
          query = query.in('debtor_name', filters.debtors);
        }

        if (filters.search_term) {
          query = query.or(`debtor_name.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%,document_number.ilike.%${filters.search_term}%,notes.ilike.%${filters.search_term}%`);
        }
      }

      // Execute the query with a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido ao buscar dados')), 15000);
      });

      const queryPromise = query;
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      // TypeScript won't know result is from Supabase, so we need to cast it
      const { data, error } = result as { data: Debt[] | null, error: Error | null };

      if (error) throw error;

      if (!data || data.length === 0) {
        const emptySummary: DebtSummary = {
          total_count: 0,
          total_amount: 0,
          pending_amount: 0,
          overdue_amount: 0,
          paid_amount: 0,
          pending_count: 0,
          overdue_count: 0,
          paid_count: 0,
          by_category: [],
          by_month: []
        };
        setSummary(emptySummary);
        return emptySummary;
      }

      // Calculate summary statistics
      const totalAmount = data.reduce((sum, debt) => sum + debt.amount, 0);
      const pendingDebts = data.filter(d => d.status === 'pending');
      const overdueDebts = data.filter(d => d.status === 'overdue');
      const paidDebts = data.filter(d => d.status === 'paid');

      const pendingAmount = pendingDebts.reduce((sum, debt) => sum + debt.amount, 0);
      const overdueAmount = overdueDebts.reduce((sum, debt) => sum + debt.amount, 0);
      const paidAmount = paidDebts.reduce((sum, debt) => sum + debt.amount, 0);

      // Get category summary
      const categoryMap = new Map<string, { id: string, name: string, total_amount: number, count: number }>();
      
      // First get all categories
      for (const category of categories) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          total_amount: 0,
          count: 0
        });
      }
      
      // Then aggregate by categories
      for (const debt of data) {
        if (!debt.category_id) continue;
        
        const category = categoryMap.get(debt.category_id);
        if (category) {
          category.total_amount += debt.amount;
          category.count += 1;
        }
      }

      // Group by month
      const monthMap = new Map<string, { month: string, amount: number, count: number }>();
      
      for (const debt of data) {
        const date = new Date(debt.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: monthLabel,
            amount: 0,
            count: 0
          });
        }
        
        const monthData = monthMap.get(monthKey)!;
        monthData.amount += debt.amount;
        monthData.count += 1;
      }

      // Build summary object
      const summary: DebtSummary = {
        total_count: data.length,
        total_amount: totalAmount,
        pending_amount: pendingAmount,
        overdue_amount: overdueAmount,
        paid_amount: paidAmount,
        pending_count: pendingDebts.length,
        overdue_count: overdueDebts.length,
        paid_count: paidDebts.length,
        by_category: Array.from(categoryMap.values()),
        by_month: Array.from(monthMap.values())
      };

      setSummary(summary);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular resumo';
      setError(errorMessage);
      console.error('Erro ao calcular resumo:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Export debts to Excel
  const exportToExcel = (filteredDebts: Debt[], fileName: string = 'dividas_relatório.xlsx') => {
    const formattedData = filteredDebts.map(debt => {
      // Find category name
      const category = categories.find(c => c.id === debt.category_id);
      
      return {
        'Devedor': debt.debtor_name,
        'Valor': debt.amount,
        'Data de Vencimento': new Date(debt.due_date).toLocaleDateString('pt-BR'),
        'Categoria': category?.name || '',
        'Status': formatStatus(debt.status),
        'Descrição': debt.description || '',
        'Documento': debt.document_number || '',
        'Recorrente': debt.recurring ? 'Sim' : 'Não',
        'Data de Criação': new Date(debt.created_at).toLocaleDateString('pt-BR')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dívidas');

    // Format headers
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center' }
    };
    
    // Set column widths
    const colWidths = [
      { wch: 30 }, // Devedor
      { wch: 12 }, // Valor
      { wch: 15 }, // Data de Vencimento
      { wch: 15 }, // Categoria
      { wch: 15 }, // Status
      { wch: 40 }, // Descrição
      { wch: 15 }, // Documento
      { wch: 10 }, // Recorrente
      { wch: 15 }  // Data de Criação
    ];
    
    worksheet['!cols'] = colWidths;

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(fileData, fileName);
  };

  // Export debts to PDF
  const exportToPDF = (filteredDebts: Debt[], fileName: string = 'dividas_relatório.pdf') => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Relatório de Dívidas', 14, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
    
    // Calculate summary stats
    const totalAmount = filteredDebts.reduce((sum, debt) => sum + debt.amount, 0);
    const pendingCount = filteredDebts.filter(d => d.status === 'pending' || d.status === 'overdue').length;
    const paidCount = filteredDebts.filter(d => d.status === 'paid').length;

    // Add summary
    doc.text(`Total: ${filteredDebts.length} dívidas - R$ ${totalAmount.toFixed(2)}`, 14, 36);
    doc.text(`Pendentes: ${pendingCount} - Pagas: ${paidCount}`, 14, 44);
    
    // Prepare table data
    const tableColumn = [
      'Devedor', 
      'Valor', 
      'Vencimento', 
      'Categoria',
      'Status'
    ];
    const tableRows = filteredDebts.map(debt => {
      const category = categories.find(c => c.id === debt.category_id);
      return [
        debt.debtor_name,
        `R$ ${debt.amount.toFixed(2)}`,
        new Date(debt.due_date).toLocaleDateString('pt-BR'),
        category?.name || '',
        formatStatus(debt.status)
      ];
    });
    
    // Add table
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(fileName);
  };

  // Helper function to format status text
  const formatStatus = (status: DebtStatus): string => {
    const statusMap: Record<DebtStatus, string> = {
      'pending': 'Pendente',
      'partial': 'Parcialmente Pago',
      'paid': 'Pago',
      'overdue': 'Atrasado',
      'renegotiated': 'Renegociado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // Generate status color classes
  const getStatusColor = (status: DebtStatus): string => {
    const colorMap: Record<DebtStatus, string> = {
      'pending': 'bg-blue-100 text-blue-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'renegotiated': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Load data on mount
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchDebts();
    }
  }, [user, fetchCategories, fetchDebts]);

  return {
    debts,
    categories,
    isLoading,
    error,
    summary,
    fetchDebts,
    fetchCategories,
    createDebt,
    updateDebt,
    deleteDebt,
    registerPayment,
    uploadAttachment,
    fetchDebtSummary,
    exportToExcel,
    exportToPDF,
    formatStatus,
    getStatusColor
  };
}

export default useDebts;