import { useState, useCallback } from 'react';
import BankIntegration from '../services/bankIntegration';

export function useBankIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (
    credentials: {
      bank: 'nubank' | 'bancodobrasil' | 'bradesco' | 'stone';
      clientId: string;
      clientSecret: string;
      certificateKey?: string;
    },
    startDate: Date,
    endDate: Date
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const bankIntegration = new BankIntegration(credentials);
      const transactions = await bankIntegration.getTransactions(startDate, endDate);
      return transactions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importOFXFile = useCallback(async (fileContent: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const bankIntegration = new BankIntegration({ bank: 'nubank', clientId: '', clientSecret: '' });
      const transactions = await bankIntegration.importOFXFile(fileContent);
      return transactions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import OFX file');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importCNABFile = useCallback(async (fileContent: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const bankIntegration = new BankIntegration({ bank: 'nubank', clientId: '', clientSecret: '' });
      const transactions = await bankIntegration.importCNABFile(fileContent);
      return transactions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CNAB file');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchTransactions,
    importOFXFile,
    importCNABFile,
    isLoading,
    error
  };
}