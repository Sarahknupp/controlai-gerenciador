import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Plus, 
  Filter, 
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  ExternalLink,
  Printer,
  ChevronsUp,
  ChevronsDown,
  BarChart2,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  Copy,
  Phone,
  Mail
} from 'lucide-react';
import { useDebtSearch } from '../hooks/useDebtSearch';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DebtManagement: React.FC = () => {
  // API keys would normally come from environment variables or a secure storage
  // For demo purposes, using placeholder values
  const apiKeys = {
    serasa: 'demo-serasa-key',
    spc: 'demo-spc-key',
    receita: 'demo-receita-key',
    protesto: 'demo-protesto-key',
    boletos: 'demo-boletos-key'
  };

  const { 
    searchDebts, 
    isLoading, 
    error, 
    clearError, 
    debtRecords, 
    searchHistory 
  } = useDebtSearch(apiKeys);

  const [identifier, setIdentifier] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'cpf' | 'cnpj'>('cpf');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [expandedDebtIds, setExpandedDebtIds] = useState<string[]>([]);
  
  const toggleDebtExpansion = (debtId: string) => {
    if (expandedDebtIds.includes(debtId)) {
      setExpandedDebtIds(expandedDebtIds.filter(id => id !== debtId));
    } else {
      setExpandedDebtIds([...expandedDebtIds, debtId]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!identifier.trim()) {
      return;
    }
    
    await searchDebts(identifier);
  };

  const handleHistorySelect = (item: string) => {
    setIdentifier(item);
    setShowHistory(false);
    searchDebts(item);
  };

  const formatIdentifier = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (searchMode === 'cpf') {
      // Format as CPF: 000.000.000-00
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      // Format as CNPJ: 00.000.000/0000-00
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIdentifier(e.target.value);
    setIdentifier(formatted);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'regular':
        return <span className="badge bg-blue-100 text-blue-700">Regular</span>;
      case 'late':
        return <span className="badge bg-red-100 text-red-700">Em Atraso</span>;
      case 'renegotiated':
        return <span className="badge bg-yellow-100 text-yellow-700">Renegociado</span>;
      case 'legal':
        return <span className="badge bg-purple-100 text-purple-700">Judicial</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5 text-indigo-600" />;
      case 'tax':
        return <FileText className="h-5 w-5 text-amber-600" />;
      case 'service':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'loan':
        return 'Empréstimo';
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'tax':
        return 'Impostos/Tributos';
      case 'service':
        return 'Serviços';
      default:
        return 'Outros';
    }
  };

  // Calculate summary statistics
  const totalDebtAmount = debtRecords.reduce((sum, debt) => sum + debt.currentAmount, 0);
  const totalOriginalAmount = debtRecords.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const lateDebts = debtRecords.filter(debt => debt.status === 'late').length;
  const legalDebts = debtRecords.filter(debt => debt.status === 'legal').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Dívidas</h1>
          <p className="text-gray-500">Consulte e gerencie pendências financeiras</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Dívida
          </button>
        </div>
      </div>

      {/* Summary cards (shown when there's data) */}
      {debtRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total de Dívidas</h3>
                <p className="text-2xl font-bold text-gray-900">R$ {totalDebtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Acréscimos</h3>
                <p className="text-2xl font-bold text-gray-900">R$ {(totalDebtAmount - totalOriginalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Dívidas em Atraso</h3>
                <p className="text-2xl font-bold text-gray-900">{lateDebts} pendências</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <BarChart2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Protestos/Judicial</h3>
                <p className="text-2xl font-bold text-gray-900">{legalDebts} pendências</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Panel */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Consulta de Pendências</h2>
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button 
                type="button"
                className={`px-4 py-2 rounded-md text-sm font-medium ${searchMode === 'cpf' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setSearchMode('cpf')}
              >
                CPF
              </button>
              <button 
                type="button"
                className={`px-4 py-2 rounded-md text-sm font-medium ${searchMode === 'cnpj' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setSearchMode('cnpj')}
              >
                CNPJ
              </button>
            </div>
            
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10 pr-10"
                placeholder={searchMode === 'cpf' ? 'Digite o CPF para consulta' : 'Digite o CNPJ para consulta'}
                value={identifier}
                onChange={handleIdentifierChange}
              />
              {identifier && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setIdentifier('')}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              
              {/* Search history dropdown trigger */}
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  className="absolute right-0 top-full mt-1 text-xs text-primary"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  Histórico de consultas
                </button>
              )}
              
              {/* Search history dropdown */}
              {showHistory && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                  <ul className="py-1 max-h-60 overflow-auto">
                    {searchHistory.map((item, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => handleHistorySelect(item)}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading || !identifier.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Consultar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Search info text */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informações da consulta</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Esta consulta busca pendências financeiras em diversos órgãos, incluindo Serasa, SPC Brasil, 
                  protestos em cartórios e sistema bancário. Os resultados são apenas informativos e podem 
                  não estar 100% atualizados.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {debtRecords.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Resultado da Consulta
              <span className="text-sm font-normal ml-2 text-gray-500">
                {debtRecords.length} {debtRecords.length === 1 ? 'pendência encontrada' : 'pendências encontradas'}
              </span>
            </h2>
            <div className="flex space-x-2">
              <button className="btn-outline py-1 px-3 text-sm">
                <Filter className="h-3 w-3 mr-1" />
                Filtrar
              </button>
              <button className="btn-outline py-1 px-3 text-sm">
                <Printer className="h-3 w-3 mr-1" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Debt records */}
          <div className="space-y-4">
            {debtRecords.map((debt) => (
              <div 
                key={debt.id} 
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  debt.status === 'late' ? 'border-red-200' : 
                  debt.status === 'legal' ? 'border-purple-200' : 
                  'border-gray-200'
                }`}
              >
                {/* Debt summary (always visible) */}
                <div 
                  className={`p-4 ${
                    debt.status === 'late' ? 'bg-red-50' : 
                    debt.status === 'legal' ? 'bg-purple-50' : 
                    'bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start">
                      <div className="mr-3">
                        {getTypeIcon(debt.type)}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-gray-900">{debt.creditor}</h3>
                          <span className="ml-2">
                            {getStatusBadge(debt.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{debt.description}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>
                            Vencimento: {debt.dueDate.toLocaleDateString('pt-BR')} 
                            ({formatDistanceToNow(debt.dueDate, { addSuffix: true, locale: ptBR })})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-bold text-gray-900">
                        R$ {debt.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {debt.originalAmount !== debt.currentAmount && (
                        <div className="text-xs text-gray-500">
                          Valor original: R$ {debt.originalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      <div className="flex mt-2">
                        <button className="text-sm text-primary" onClick={() => toggleDebtExpansion(debt.id)}>
                          {expandedDebtIds.includes(debt.id) ? (
                            <div className="flex items-center">
                              <ChevronsUp className="h-4 w-4 mr-1" />
                              Menos detalhes
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <ChevronsDown className="h-4 w-4 mr-1" />
                              Mais detalhes
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedDebtIds.includes(debt.id) && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Informações Detalhadas</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Valor original:</span>
                            <span className="text-sm font-medium">
                              R$ {debt.originalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Acréscimos:</span>
                            <span className="text-sm font-medium">
                              R$ {(debt.currentAmount - debt.originalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total atual:</span>
                            <span className="text-sm font-medium">
                              R$ {debt.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo:</span>
                            <span className="text-sm font-medium">{getTypeLabel(debt.type)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Data de vencimento:</span>
                            <span className="text-sm font-medium">{debt.dueDate.toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Última atualização:</span>
                            <span className="text-sm font-medium">{debt.lastUpdate.toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fonte:</span>
                            <span className="text-sm font-medium">{debt.source}</span>
                          </div>
                        </div>

                        {debt.contactInfo && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Informações de Contato</h4>
                            {debt.contactInfo.phone && (
                              <div className="flex items-center text-sm mb-2">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{debt.contactInfo.phone}</span>
                              </div>
                            )}
                            {debt.contactInfo.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{debt.contactInfo.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        {debt.paymentOptions && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Opções de Pagamento</h4>
                            <div className={`p-3 rounded-lg ${debt.paymentOptions.hasDiscount ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'}`}>
                              {debt.paymentOptions.hasDiscount && (
                                <div className="mb-3">
                                  <div className="flex items-center text-green-700 font-medium mb-1">
                                    <Check className="h-4 w-4 mr-1" />
                                    Desconto Disponível
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {debt.paymentOptions.discountAmount && (
                                      <div className="flex justify-between mb-1">
                                        <span>Valor do desconto:</span>
                                        <span className="font-medium">
                                          R$ {debt.paymentOptions.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                    {debt.paymentOptions.discountDeadline && (
                                      <div className="flex justify-between">
                                        <span>Válido até:</span>
                                        <span className="font-medium">
                                          {debt.paymentOptions.discountDeadline.toLocaleDateString('pt-BR')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {debt.paymentOptions.paymentLink && (
                                <button className="btn-primary w-full">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Pagar Online
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col space-y-3">
                          <button className="btn-outline flex items-center justify-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Entrar em Contato
                          </button>
                          
                          <button className="btn-outline flex items-center justify-center">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Comprovante
                          </button>
                          
                          <button className="btn-outline flex items-center justify-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar Pagamento
                          </button>
                          
                          <button className="btn-primary flex items-center justify-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Registrar Negociação
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty results state */}
      {identifier && !isLoading && debtRecords.length === 0 && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-2">Nenhuma pendência encontrada</h3>
          <p className="text-green-700">
            Não foram encontradas dívidas, protestos ou restrições para o {searchMode === 'cpf' ? 'CPF' : 'CNPJ'} consultado.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebtManagement;