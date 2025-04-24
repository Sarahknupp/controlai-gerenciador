import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  CashierSession,
  CashFlow,
  CashierOperationType,
  CashierSessionStatus,
  CashierSummary
} from '../types/pos';

interface CashierContextType {
  currentSession: CashierSession | null;
  isSessionOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openCashier: (initialAmount: number) => Promise<boolean>;
  closeCashier: (finalAmount: number, notes: string) => Promise<boolean>;
  addCashFlow: (amount: number, type: CashierOperationType, reason: string) => Promise<boolean>;
  getSessionSummary: () => Promise<CashierSummary | null>;
  getTransactionHistory: () => Promise<CashFlow[]>;
  validateCashierAccess: () => boolean;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<CashierSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isSessionOpen = !!currentSession && currentSession.status === 'open';

  // Load current session on mount
  useEffect(() => {
    const loadCurrentSession = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('cashier_sessions')
          .select('*')
          .eq('operator_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        setCurrentSession(data || null);
      } catch (err) {
        console.error('Error loading cashier session:', err);
        setError('Falha ao carregar sessão do caixa');
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentSession();
  }, [user]);

  // Open a new cashier session
  const openCashier = async (initialAmount: number): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    if (isSessionOpen) {
      setError('Já existe um caixa aberto');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a new session
      const newSession: Omit<CashierSession, 'id'> = {
        operator_id: user.id,
        terminal_id: window.location.hostname, // In a real app, this would be a proper terminal ID
        initial_amount: initialAmount,
        current_amount: initialAmount,
        status: 'open',
        opened_at: new Date().toISOString(),
        closed_at: null,
        notes: '',
      };

      const { data, error: insertError } = await supabase
        .from('cashier_sessions')
        .insert(newSession)
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentSession(data);

      // Log the cash flow for the initial amount
      const { error: flowError } = await supabase
        .from('cash_flow')
        .insert({
          session_id: data.id,
          amount: initialAmount,
          operation_type: 'initial_balance',
          notes: 'Abertura de caixa',
          operator_id: user.id,
        });

      if (flowError) throw flowError;

      return true;
    } catch (err) {
      console.error('Error opening cashier:', err);
      setError('Falha ao abrir caixa');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Close the current cashier session
  const closeCashier = async (finalAmount: number, notes: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    if (!currentSession) {
      setError('Nenhum caixa aberto');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('cashier_sessions')
        .update({
          final_amount: finalAmount,
          notes: notes,
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id);

      if (updateError) throw updateError;

      // Add the final balance to cash flow
      const { error: flowError } = await supabase
        .from('cash_flow')
        .insert({
          session_id: currentSession.id,
          amount: finalAmount,
          operation_type: 'final_balance',
          notes: 'Fechamento de caixa',
          operator_id: user.id,
        });

      if (flowError) throw flowError;

      setCurrentSession(null);
      return true;
    } catch (err) {
      console.error('Error closing cashier:', err);
      setError('Falha ao fechar caixa');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a cash flow operation (withdraw or deposit)
  const addCashFlow = async (amount: number, type: CashierOperationType, reason: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    if (!currentSession) {
      setError('Nenhum caixa aberto');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add the cash flow record
      const { error: flowError } = await supabase
        .from('cash_flow')
        .insert({
          session_id: currentSession.id,
          amount: amount,
          operation_type: type,
          notes: reason,
          operator_id: user.id,
        });

      if (flowError) throw flowError;

      // Update the current amount in the session
      const newAmount = type === 'withdraw' 
        ? currentSession.current_amount - amount
        : currentSession.current_amount + amount;

      const { data, error: updateError } = await supabase
        .from('cashier_sessions')
        .update({
          current_amount: newAmount,
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCurrentSession(data);
      return true;
    } catch (err) {
      console.error('Error adding cash flow:', err);
      setError('Falha ao registrar movimento de caixa');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get session summary with transaction totals
  const getSessionSummary = async (): Promise<CashierSummary | null> => {
    if (!currentSession) {
      return null;
    }

    try {
      // Get sales and payment methods for the current session
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id, 
          total, 
          payment_method_id, 
          payment_methods (name)
        `)
        .eq('cashier_session_id', currentSession.id);

      if (salesError) throw salesError;

      // Get cash flow operations for the current session
      const { data: flows, error: flowsError } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('session_id', currentSession.id);

      if (flowsError) throw flowsError;

      // Calculate totals by payment method
      const paymentMethods: Record<string, number> = {};
      sales.forEach((sale) => {
        const methodName = sale.payment_methods?.name || 'Desconhecido';
        paymentMethods[methodName] = (paymentMethods[methodName] || 0) + sale.total;
      });

      // Calculate withdrawals and deposits
      const withdrawals = flows.filter(flow => flow.operation_type === 'withdraw')
        .reduce((sum, flow) => sum + flow.amount, 0);
        
      const deposits = flows.filter(flow => flow.operation_type === 'deposit')
        .reduce((sum, flow) => sum + flow.amount, 0);

      // Calculate totals
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

      // Calculate expected cash amount
      const paymentMethodArray = Object.entries(paymentMethods).map(([name, amount]) => ({ name, amount }));
      const cashPayments = paymentMethodArray.find(m => m.name === 'Dinheiro')?.amount || 0;
      const expectedCashAmount = currentSession.initial_amount + cashPayments - withdrawals + deposits;

      return {
        sessionId: currentSession.id,
        openedAt: currentSession.opened_at,
        initialAmount: currentSession.initial_amount,
        currentAmount: currentSession.current_amount,
        totalSales,
        salesCount: sales.length,
        paymentMethods: paymentMethodArray,
        withdrawals,
        deposits,
        expectedCashAmount,
        difference: currentSession.current_amount - expectedCashAmount,
      };
    } catch (err) {
      console.error('Error getting session summary:', err);
      setError('Falha ao obter resumo do caixa');
      return null;
    }
  };

  // Get transaction history for the current session
  const getTransactionHistory = async (): Promise<CashFlow[]> => {
    if (!currentSession) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('session_id', currentSession.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error getting transaction history:', err);
      setError('Falha ao obter histórico de transações');
      return [];
    }
  };

  // Validate if the current user has access to cashier operations
  const validateCashierAccess = useCallback((): boolean => {
    if (!user) return false;

    // In a real app, you would check user roles or permissions
    // This is a simplified version
    return true;
  }, [user]);

  const contextValue: CashierContextType = {
    currentSession,
    isSessionOpen,
    isLoading,
    error,
    openCashier,
    closeCashier,
    addCashFlow,
    getSessionSummary,
    getTransactionHistory,
    validateCashierAccess,
  };

  return (
    <CashierContext.Provider value={contextValue}>
      {children}
    </CashierContext.Provider>
  );
};

export const useCashier = () => {
  const context = useContext(CashierContext);
  if (context === undefined) {
    throw new Error('useCashier must be used within a CashierProvider');
  }
  return context;
};