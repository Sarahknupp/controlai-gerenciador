import { useState, useCallback } from 'react';
import { useCashier } from '../contexts/CashierContext';
import { CashierOperationType } from '../types/pos';

interface UseCashRegisterProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useCashRegister({ onSuccess, onError }: UseCashRegisterProps = {}) {
  const { 
    currentSession,
    isSessionOpen,
    openCashier,
    closeCashier,
    addCashFlow,
    getSessionSummary,
    getTransactionHistory,
    isLoading: isCashierLoading,
    error: cashierError
  } = useCashier();

  const [isLoading, setIsLoading] = useState(false);
  const [cashSummary, setCashSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [closureInput, setClosureInput] = useState({
    countedAmount: 0,
    notes: '',
  });

  // Clear any error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load the session data
  const loadSessionData = useCallback(async () => {
    if (!isSessionOpen) return;

    setIsLoading(true);
    try {
      // Get session summary
      const summary = await getSessionSummary();
      setCashSummary(summary);

      // Get transaction history
      const history = await getTransactionHistory();
      setTransactions(history);

      if (summary) {
        // Set initial counted amount to expected amount for convenience
        setClosureInput(prev => ({
          ...prev,
          countedAmount: summary.expectedCashAmount,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados da sessão';
      setError(message);
      if (onError) onError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSessionOpen, getSessionSummary, getTransactionHistory, onError]);

  // Open the cash register with initial amount
  const handleOpenCashier = useCallback(async (initialAmount: number) => {
    setIsLoading(true);
    try {
      const success = await openCashier(initialAmount);
      if (success) {
        if (onSuccess) onSuccess('Caixa aberto com sucesso');
        return true;
      } else {
        throw new Error('Falha ao abrir caixa');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao abrir caixa';
      setError(message);
      if (onError) onError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [openCashier, onSuccess, onError]);

  // Close the cash register
  const handleCloseCashier = useCallback(async () => {
    if (!closureInput.countedAmount) {
      setError('Informe o valor contado em caixa');
      if (onError) onError('Informe o valor contado em caixa');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await closeCashier(
        closureInput.countedAmount,
        closureInput.notes || 'Fechamento de caixa'
      );

      if (success) {
        if (onSuccess) onSuccess('Caixa fechado com sucesso');
        setCashSummary(null);
        setTransactions([]);
        return true;
      } else {
        throw new Error('Falha ao fechar caixa');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fechar caixa';
      setError(message);
      if (onError) onError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [closeCashier, closureInput, onSuccess, onError]);

  // Add cash to the register (suprimento de caixa)
  const handleCashDeposit = useCallback(async (amount: number, reason: string) => {
    if (!amount || amount <= 0) {
      setError('Valor deve ser maior que zero');
      if (onError) onError('Valor deve ser maior que zero');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await addCashFlow(amount, 'deposit', reason);
      if (success) {
        // Reload session data
        await loadSessionData();
        if (onSuccess) onSuccess('Suprimento registrado com sucesso');
        return true;
      } else {
        throw new Error('Falha ao registrar suprimento');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar suprimento';
      setError(message);
      if (onError) onError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addCashFlow, loadSessionData, onSuccess, onError]);

  // Remove cash from the register (sangria de caixa)
  const handleCashWithdraw = useCallback(async (amount: number, reason: string) => {
    if (!amount || amount <= 0) {
      setError('Valor deve ser maior que zero');
      if (onError) onError('Valor deve ser maior que zero');
      return false;
    }

    // Check if there's enough cash in the register
    if (currentSession && amount > currentSession.current_amount) {
      const message = 'Valor de sangria maior que o saldo atual do caixa';
      setError(message);
      if (onError) onError(message);
      return false;
    }

    setIsLoading(true);
    try {
      const success = await addCashFlow(amount, 'withdraw', reason);
      if (success) {
        // Reload session data
        await loadSessionData();
        if (onSuccess) onSuccess('Sangria registrada com sucesso');
        return true;
      } else {
        throw new Error('Falha ao registrar sangria');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar sangria';
      setError(message);
      if (onError) onError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addCashFlow, currentSession, loadSessionData, onSuccess, onError]);

  // Update closure input fields
  const updateClosureInput = useCallback((field: string, value: any) => {
    setClosureInput(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return {
    // State
    isLoading: isLoading || isCashierLoading,
    error: error || cashierError,
    cashSummary,
    transactions,
    currentSession,
    isSessionOpen,
    closureInput,

    // Actions
    openCashier: handleOpenCashier,
    closeCashier: handleCloseCashier,
    addDeposit: handleCashDeposit,
    addWithdraw: handleCashWithdraw,
    loadSessionData,
    updateClosureInput,
    clearError,

    // Utilities
    formatOperationType: (type: CashierOperationType) => {
      const typeMap: Record<CashierOperationType, string> = {
        'initial_balance': 'Saldo Inicial',
        'final_balance': 'Saldo Final',
        'withdraw': 'Sangria',
        'deposit': 'Suprimento',
        'sale': 'Venda',
        'refund': 'Estorno',
        'correction': 'Correção'
      };
      return typeMap[type] || type;
    }
  };
}

export default useCashRegister;