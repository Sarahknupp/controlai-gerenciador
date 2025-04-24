import React, { useState, useEffect } from 'react';
import { 
  ChevronsDown, 
  DollarSign, 
  ArrowDown, 
  ArrowUp, 
  XCircle, 
  CheckCircle, 
  Clock,
  Loader,
  FileText,
  AlertTriangle,
  Calculator,
  Printer,
  X
} from 'lucide-react';
import { useCashRegister } from '../../hooks/useCashRegister';

interface CashierOperationsProps {
  onClose: () => void;
}

const CashierOperations: React.FC<CashierOperationsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'open' | 'close' | 'withdraw' | 'deposit' | 'summary'>('open');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { 
    currentSession, 
    isSessionOpen, 
    isLoading, 
    cashSummary,
    transactions,
    closureInput,
    error,
    clearError, 
    openCashier,
    closeCashier,
    addWithdraw,
    addDeposit,
    loadSessionData,
    updateClosureInput,
    formatOperationType
  } = useCashRegister({
    onSuccess: (message) => {
      setSuccessMessage(message);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  });
  
  // Load session data when component mounts
  useEffect(() => {
    if (isSessionOpen) {
      loadSessionData();
      setActiveTab('summary');
    } else {
      setActiveTab('open');
    }
  }, [isSessionOpen, loadSessionData]);
  
  // Handle form submission for opening cashier
  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const initialAmount = parseFloat(amount);
    if (isNaN(initialAmount)) return;
    
    const success = await openCashier(initialAmount);
    if (success) {
      setAmount('');
      setActiveTab('summary');
    }
  };
  
  // Handle form submission for closing cashier
  const handleCloseCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.confirm('Tem certeza que deseja fechar o caixa?')) return;
    
    const success = await closeCashier();
    if (success) {
      onClose();
    }
  };
  
  // Handle form submission for cash withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount)) return;
    
    const success = await addWithdraw(withdrawAmount, reason);
    if (success) {
      setAmount('');
      setReason('');
    }
  };
  
  // Handle form submission for cash deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount)) return;
    
    const success = await addDeposit(depositAmount, reason);
    if (success) {
      setAmount('');
      setReason('');
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="flex justify-between items-center py-4 px-6 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary" />
            Operações de Caixa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          {!isSessionOpen && (
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'open'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
              onClick={() => setActiveTab('open')}
            >
              Abertura de Caixa
            </button>
          )}
          
          {isSessionOpen && (
            <>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                onClick={() => setActiveTab('summary')}
              >
                Resumo do Caixa
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'withdraw'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                onClick={() => setActiveTab('withdraw')}
              >
                Sangria
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'deposit'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                onClick={() => setActiveTab('deposit')}
              >
                Suprimento
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'close'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                onClick={() => setActiveTab('close')}
              >
                Fechamento
              </button>
            </>
          )}
        </div>
        
        <div className="p-6">
          {/* Success message */}
          {showSuccessMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative animate-fade-in">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {successMessage}
              </span>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {error}
                </span>
                <button onClick={clearError} className="text-red-600 hover:text-red-800">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Processando...</span>
            </div>
          )}
          
          {!isLoading && (
            <>
              {/* Open Cashier Form */}
              {activeTab === 'open' && !isSessionOpen && (
                <form onSubmit={handleOpenCashier} className="space-y-4 max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Abertura de Caixa</h3>
                    <p className="text-sm text-gray-600">Informe o valor inicial em dinheiro</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Inicial (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input pl-10 pr-3"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2"
                      disabled={!amount || isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Abrir Caixa
                    </button>
                  </div>
                </form>
              )}
              
              {/* Close Cashier Form */}
              {activeTab === 'close' && isSessionOpen && (
                <form onSubmit={handleCloseCashier} className="space-y-4 max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Fechamento de Caixa</h3>
                    <p className="text-sm text-gray-600">
                      Realize a contagem física do dinheiro em caixa
                    </p>
                  </div>
                  
                  {cashSummary && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 text-sm">Saldo Inicial:</span>
                        <span className="font-medium">{formatCurrency(cashSummary.initialAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 text-sm">+ Vendas em Dinheiro:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            cashSummary.paymentMethods.find(m => m.name === 'Dinheiro')?.amount || 0
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 text-sm">+ Suprimentos:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(cashSummary.deposits)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between mb-2 border-b pb-2">
                        <span className="text-gray-600 text-sm">- Sangrias:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(cashSummary.withdrawals)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between font-bold">
                        <span>Saldo Esperado:</span>
                        <span>{formatCurrency(cashSummary.expectedCashAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Contado (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input pl-10 pr-3"
                        value={closureInput.countedAmount}
                        onChange={(e) => updateClosureInput('countedAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                  
                  {cashSummary && cashSummary.expectedCashAmount !== closureInput.countedAmount && (
                    <div className={`p-3 rounded-lg ${
                      closureInput.countedAmount < cashSummary.expectedCashAmount
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {closureInput.countedAmount < cashSummary.expectedCashAmount
                            ? 'Falta'
                            : 'Sobra'} de caixa: {formatCurrency(
                            Math.abs(closureInput.countedAmount - cashSummary.expectedCashAmount)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      className="input"
                      value={closureInput.notes}
                      onChange={(e) => updateClosureInput('notes', e.target.value)}
                      rows={3}
                      placeholder="Registre qualquer ocorrência no caixa..."
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2"
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Fechar Caixa
                    </button>
                  </div>
                </form>
              )}
              
              {/* Withdraw Cash (Sangria) Form */}
              {activeTab === 'withdraw' && isSessionOpen && (
                <form onSubmit={handleWithdraw} className="space-y-4 max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Sangria de Caixa</h3>
                    <p className="text-sm text-gray-600">
                      Retire dinheiro do caixa
                    </p>
                  </div>
                  
                  {currentSession && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Saldo atual em caixa:</span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(currentSession.current_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ArrowUp className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={currentSession?.current_amount || 0}
                        step="0.01"
                        className="input pl-10 pr-3"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo da Sangria
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Informe o motivo da sangria"
                      required
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2"
                      disabled={!amount || isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Sangria
                    </button>
                  </div>
                </form>
              )}
              
              {/* Deposit Cash (Suprimento) Form */}
              {activeTab === 'deposit' && isSessionOpen && (
                <form onSubmit={handleDeposit} className="space-y-4 max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Suprimento de Caixa</h3>
                    <p className="text-sm text-gray-600">
                      Adicione dinheiro ao caixa
                    </p>
                  </div>
                  
                  {currentSession && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Saldo atual em caixa:</span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(currentSession.current_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ArrowDown className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input pl-10 pr-3"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo do Suprimento
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Informe o motivo do suprimento"
                      required
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2"
                      disabled={!amount || isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Suprimento
                    </button>
                  </div>
                </form>
              )}
              
              {/* Cashier Summary */}
              {activeTab === 'summary' && isSessionOpen && (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Resumo do Caixa</h3>
                    {currentSession && (
                      <p className="text-sm text-gray-600">
                        Aberto em: {new Date(currentSession.opened_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  
                  {cashSummary ? (
                    <div className="space-y-6">
                      {/* Cashier balance summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border">
                          <h4 className="font-medium text-gray-700 mb-3">Saldo do Caixa</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Saldo Inicial:</span>
                              <span className="font-medium">{formatCurrency(cashSummary.initialAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">+ Vendas em Dinheiro:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(
                                  cashSummary.paymentMethods.find(m => m.name === 'Dinheiro')?.amount || 0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">+ Suprimentos:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(cashSummary.deposits)}
                              </span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                              <span className="text-gray-600">- Sangrias:</span>
                              <span className="font-medium text-red-600">
                                {formatCurrency(cashSummary.withdrawals)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="font-bold">Saldo Atual:</span>
                              <span className="font-bold">
                                {formatCurrency(cashSummary.expectedCashAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow border">
                          <h4 className="font-medium text-gray-700 mb-3">Resumo de Vendas</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total de Vendas:</span>
                              <span className="font-medium">
                                {cashSummary.salesCount} {cashSummary.salesCount === 1 ? 'venda' : 'vendas'}
                              </span>
                            </div>
                            <div className="flex justify-between pb-2 border-b">
                              <span className="text-gray-600">Volume de Vendas:</span>
                              <span className="font-medium">{formatCurrency(cashSummary.totalSales)}</span>
                            </div>
                            
                            {/* Payment method breakdown */}
                            <h5 className="font-medium text-gray-600 text-xs mt-3 mb-1">Por Forma de Pagamento:</h5>
                            {cashSummary.paymentMethods.map((method, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-gray-600 text-sm">{method.name}:</span>
                                <span className="font-medium text-sm">{formatCurrency(method.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Transaction history */}
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700">Movimentações de Caixa</h4>
                          <button className="text-sm text-primary flex items-center">
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Imprimir
                          </button>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operação</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {transactions.length > 0 ? (
                                transactions.map((transaction, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(transaction.created_at).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        transaction.operation_type === 'withdraw'
                                          ? 'bg-red-100 text-red-800'
                                          : transaction.operation_type === 'deposit'
                                          ? 'bg-green-100 text-green-800'
                                          : transaction.operation_type === 'initial_balance'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {formatOperationType(transaction.operation_type)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {transaction.notes}
                                    </td>
                                    <td className={`px-4 py-2 text-sm text-right font-medium ${
                                      transaction.operation_type === 'withdraw'
                                        ? 'text-red-600'
                                        : transaction.operation_type === 'deposit'
                                        ? 'text-green-600'
                                        : 'text-gray-900'
                                    }`}>
                                      {transaction.operation_type === 'withdraw' ? '-' : ''}{formatCurrency(transaction.amount)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                    Nenhuma movimentação registrada
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-between">
                        <div className="space-x-2">
                          <button
                            type="button"
                            className="btn-outline py-2 px-3"
                            onClick={() => setActiveTab('withdraw')}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Sangria
                          </button>
                          <button
                            type="button"
                            className="btn-outline py-2 px-3"
                            onClick={() => setActiveTab('deposit')}
                          >
                            <ArrowDown className="h-4 w-4 mr-1" />
                            Suprimento
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          className="btn-primary py-2 px-4"
                          onClick={() => setActiveTab('close')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Fechar Caixa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-gray-600">Carregando dados do caixa...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierOperations;