import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, RefreshCw, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { fiscalService } from '../services/fiscalService';

/**
 * Widget para exibir status do serviço fiscal e sincronizar documentos offline
 */
const FiscalDocumentWidget: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [offlineDocumentCount, setOfflineDocumentCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    failed: number;
    message: string;
  } | null>(null);
  const [checkingError, setCheckingError] = useState<string | null>(null);

  // Verificar status do serviço fiscal e documentos offline
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingError(null);
        
        // Verificar status do serviço
        const isAvailable = await fiscalService.checkServiceAvailability();
        setServiceStatus(isAvailable ? 'online' : 'offline');
        
        // Verificar documentos offline pendentes
        const offlineDocs = localStorage.getItem('offline_fiscal_documents');
        if (offlineDocs) {
          const docs = JSON.parse(offlineDocs);
          setOfflineDocumentCount(docs.length);
        } else {
          setOfflineDocumentCount(0);
        }
        
        // Verificar última sincronização
        const lastSyncStr = localStorage.getItem('last_fiscal_sync');
        if (lastSyncStr) {
          setLastSync(new Date(lastSyncStr));
        }
      } catch (error) {
        console.error("Error checking fiscal service status:", error);
        setServiceStatus('offline');
        setCheckingError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    checkStatus();
    
    // Verificar periodicamente com um intervalo maior para evitar múltiplas falhas
    const interval = setInterval(checkStatus, 120000); // A cada 2 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Manualmente verificar status quando solicitado pelo usuário
  const refreshStatus = async () => {
    try {
      setServiceStatus('checking');
      setCheckingError(null);
      
      const isAvailable = await fiscalService.checkServiceAvailability();
      setServiceStatus(isAvailable ? 'online' : 'offline');
    } catch (error) {
      console.error("Error manually checking fiscal service:", error);
      setServiceStatus('offline');
      setCheckingError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Sincronizar documentos offline
  const synchronizeOfflineDocuments = async () => {
    if (serviceStatus === 'offline' || syncStatus === 'syncing') {
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      const result = await fiscalService.syncOfflineDocuments();
      
      setSyncStatus(result.success ? 'success' : 'error');
      setSyncResult({
        synced: result.synced,
        failed: result.failed,
        message: result.message
      });
      
      // Atualizar contagem e última sincronização
      if (result.synced > 0) {
        const offlineDocs = localStorage.getItem('offline_fiscal_documents');
        if (offlineDocs) {
          const docs = JSON.parse(offlineDocs);
          setOfflineDocumentCount(docs.length);
        } else {
          setOfflineDocumentCount(0);
        }
        
        const now = new Date();
        setLastSync(now);
        localStorage.setItem('last_fiscal_sync', now.toISOString());
      }
      
      // Reset após 5 segundos
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncResult(null);
      }, 5000);
    } catch (error) {
      console.error("Error synchronizing offline documents:", error);
      
      setSyncStatus('error');
      setSyncResult({
        synced: 0,
        failed: 0,
        message: 'Erro ao sincronizar documentos'
      });
      
      // Reset após 5 segundos
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncResult(null);
      }, 5000);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-primary" />
        Status do Sistema Fiscal
      </h3>
      
      <div className="flex flex-col space-y-3">
        {/* Status de conexão */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {serviceStatus === 'checking' ? (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin mr-2" />
            ) : serviceStatus === 'online' ? (
              <Wifi className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm">
              Status do Serviço:
            </span>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-medium ${
              serviceStatus === 'online' ? 'text-green-600' : 
              serviceStatus === 'offline' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {serviceStatus === 'checking' ? 'Verificando...' : 
              serviceStatus === 'online' ? 'Online' : 'Offline'}
            </span>
            <button 
              onClick={refreshStatus} 
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Verificar novamente"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {/* Mensagem de erro (se houver) */}
        {checkingError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
            <span className="font-medium">Erro de conexão:</span> Verifique as configurações do servidor fiscal ou sua conexão de rede.
          </div>
        )}
        
        {/* Documentos pendentes */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className={`h-4 w-4 ${
              offlineDocumentCount > 0 ? 'text-yellow-500' : 'text-gray-400'
            } mr-2`} />
            <span className="text-sm">
              Documentos Pendentes:
            </span>
          </div>
          <span className={`text-sm font-medium ${
            offlineDocumentCount > 0 ? 'text-yellow-600' : 'text-gray-600'
          }`}>
            {offlineDocumentCount}
          </span>
        </div>
        
        {/* Última sincronização */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm">
              Última Sincronização:
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {formatLastSync(lastSync)}
          </span>
        </div>
        
        {/* Botão de sincronização */}
        <button
          onClick={synchronizeOfflineDocuments}
          disabled={serviceStatus !== 'online' || offlineDocumentCount === 0 || syncStatus === 'syncing'}
          className={`py-2 w-full flex items-center justify-center rounded-md font-medium text-sm ${
            offlineDocumentCount > 0 && serviceStatus === 'online' && syncStatus === 'idle'
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : syncStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sincronizado com Sucesso!
            </>
          ) : syncStatus === 'error' ? (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Erro ao Sincronizar
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Documentos
            </>
          )}
        </button>
        
        {/* Resultado da sincronização */}
        {syncResult && (
          <div className={`text-sm p-2 rounded-md ${
            syncStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {syncStatus === 'success' ? (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {syncResult.synced} documentos sincronizados
                  {syncResult.failed > 0 && `, ${syncResult.failed} falhas`}
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{syncResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiscalDocumentWidget;