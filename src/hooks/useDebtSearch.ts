import { useState, useCallback } from 'react';
import { DebtSearchService, DebtRecord } from '../services/debtSearch';

interface UseDebtSearchResult {
  searchDebts: (identifier: string) => Promise<DebtRecord[]>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  debtRecords: DebtRecord[];
  clearResults: () => void;
  searchHistory: string[];
}

export function useDebtSearch(apiKeys: {
  serasa?: string;
  spc?: string;
  receita?: string;
  protesto?: string;
  boletos?: string;
}): UseDebtSearchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debtRecords, setDebtRecords] = useState<DebtRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    // Load search history from localStorage if available
    const savedHistory = localStorage.getItem('debtSearchHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const searchDebts = useCallback(async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const service = new DebtSearchService(apiKeys);
      const debts = await service.searchDebts(identifier);
      
      // Update state with the debts
      setDebtRecords(debts);
      
      // Add to search history if not already there
      if (!searchHistory.includes(identifier)) {
        const updatedHistory = [identifier, ...searchHistory].slice(0, 10); // Keep last 10 searches
        setSearchHistory(updatedHistory);
        // Save to localStorage
        localStorage.setItem('debtSearchHistory', JSON.stringify(updatedHistory));
      }
      
      return debts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha na consulta de débitos';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiKeys, searchHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setDebtRecords([]);
  }, []);

  return {
    searchDebts,
    isLoading,
    error,
    clearError,
    debtRecords,
    clearResults,
    searchHistory
  };
}