import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Copy, Check, Clock, RefreshCw, AlertTriangle, Bell, Download } from 'lucide-react';
import QRCode from 'qrcode.react';
import { PixTransactionInfo } from '../../types/payment';
import { paymentService } from '../../services/paymentService';

interface PixPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  reference?: string;
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
}

/**
 * Componente para pagamento via PIX com QR Code
 */
const PixPayment: React.FC<PixPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  reference,
  customerName,
  customerEmail,
  customerDocument
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<PixTransactionInfo | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Inicializar o pagamento PIX
  useEffect(() => {
    const initializePixPayment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await paymentService.processPixPayment({
          amount,
          description: `Pagamento ${reference || ''}`.trim(),
          reference,
          expiresIn: 1800, // 30 minutes
          customer: {
            name: customerName,
            email: customerEmail,
            document: customerDocument
          }
        });

        if (response.success && response.transaction) {
          if (response.transaction.pixInfo) {
            setTransaction(response.transaction.pixInfo);
            setTransactionId(response.transaction.id);
            
            // Calcular tempo restante
            const expiresAt = new Date(response.transaction.pixInfo.expiresAt);
            const now = new Date();
            const diffSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
            setRemainingTime(diffSeconds > 0 ? diffSeconds : 0);
          } else {
            throw new Error('Dados de PIX não encontrados na resposta');
          }
        } else {
          throw new Error(response.error?.message || 'Erro ao inicializar pagamento PIX');
        }
      } catch (error) {
        console.error('Erro ao inicializar PIX:', error);
        setError(error instanceof Error ? error.message : 'Erro ao gerar QR Code PIX');
        onPaymentError(error instanceof Error ? error.message : 'Erro ao gerar QR Code PIX');
      } finally {
        setIsLoading(false);
      }
    };

    initializePixPayment();
  }, [amount, reference, customerName, customerEmail, customerDocument, onPaymentError]);

  // Timer para contar o tempo restante
  useEffect(() => {
    if (remainingTime <= 0 || !transaction) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, transaction]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!transactionId || remainingTime <= 0) return;

    const checkInterval = setInterval(async () => {
      await checkPaymentStatus();
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(checkInterval);
  }, [transactionId, remainingTime]);

  // Converter segundos para formato MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Copiar chave PIX para área de transferência
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Resetar o estado de "copiado" após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar para área de transferência:', err);
      setError('Não foi possível copiar para a área de transferência');
    }
  };

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!transactionId || checkingStatus) return;

    setCheckingStatus(true);
    
    try {
      const response = await paymentService.checkTransactionStatus(transactionId);
      
      if (response.success && response.transaction) {
        if (response.transaction.status === 'approved') {
          // Notificar usuário se as notificações estiverem ativadas
          if (notificationsEnabled) {
            try {
              // Notificação de pagamento recebido
              new Notification('Pagamento Recebido', {
                body: `Recebemos seu pagamento de R$ ${amount.toFixed(2)}`,
                icon: '/icons/success.png'
              });
            } catch (e) {
              // Se não conseguir enviar notificação, apenas ignore
              console.log('Notificação não enviada:', e);
            }
          }
          
          // Chamar callback de sucesso
          onPaymentSuccess(transactionId);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [transactionId, checkingStatus, amount, onPaymentSuccess, notificationsEnabled]);

  // Solicitar permissão para notificações
  const requestNotifications = () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações desktop');
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        
        // Notificação de exemplo
        new Notification('Notificações Ativadas', {
          body: 'Você será notificado quando seu pagamento for confirmado',
          icon: '/icons/notification.png'
        });
      }
    });
  };

  // Formatação de valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Download do QR Code como imagem
  const downloadQRCode = () => {
    try {
      const canvas = document.getElementById('pix-qrcode') as HTMLCanvasElement;
      if (!canvas) return;

      const pngUrl = canvas.toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `pix-qrcode-${amount.toFixed(2).replace('.', ',')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Erro ao fazer download do QR Code:', error);
      setError('Não foi possível baixar o QR Code');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-700 text-center">Gerando QR Code PIX...</p>
        <p className="text-sm text-gray-500 text-center mt-2">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Erro ao gerar PIX</h3>
            <p className="mt-1 text-red-700">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
          <p className="text-yellow-700">Não foi possível gerar o QR Code PIX</p>
        </div>
      </div>
    );
  }

  const expired = remainingTime <= 0;

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <QrCode className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Pagamento via PIX</h2>
        </div>
        <p className="text-gray-600">
          Escaneie o QR Code abaixo para finalizar o pagamento de {formatCurrency(amount)}
        </p>
      </div>

      {/* Temporizador */}
      <div className="flex items-center justify-center mb-4">
        <div className={`flex items-center px-3 py-1 rounded-full ${
          remainingTime > 300 
            ? 'bg-green-100 text-green-800' 
            : remainingTime > 60 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
        }`}>
          <Clock className="h-4 w-4 mr-2" />
          <span>
            {expired 
              ? 'QR Code expirado' 
              : `Expira em ${formatTime(remainingTime)}`}
          </span>
        </div>
      </div>

      {/* QR Code */}
      <div className={`flex justify-center ${expired ? 'opacity-50' : ''}`}>
        <div className="p-4 bg-white rounded-lg border-2 border-gray-200 inline-block">
          {transaction.qrCodeData ? (
            <QRCode 
              id="pix-qrcode"
              value={transaction.qrCodeData}
              size={200}
              level="H"
              includeMargin={true}
              renderAs="canvas"
            />
          ) : (
            <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-100">
              <AlertTriangle className="h-10 w-10 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Botão para baixar QR Code */}
      <div className="flex justify-center mt-4">
        <button 
          className="text-primary text-sm flex items-center"
          onClick={downloadQRCode}
        >
          <Download className="h-4 w-4 mr-1" />
          Baixar QR Code
        </button>
      </div>

      {/* Chave PIX */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Chave PIX:</span>
          <button 
            className={`text-sm flex items-center ${copied ? 'text-green-600' : 'text-primary'}`}
            onClick={() => transaction.key && copyToClipboard(transaction.key)}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-50 p-3 rounded-md text-sm font-mono break-all">
          {transaction.key || 'Chave não disponível'}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button 
          className="flex items-center justify-center py-2 px-4 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
          onClick={requestNotifications}
          disabled={notificationsEnabled}
        >
          <Bell className="h-4 w-4 mr-2" />
          {notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
        </button>
        <button 
          className="flex items-center justify-center py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark"
          onClick={checkPaymentStatus}
          disabled={checkingStatus || expired}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
          {checkingStatus ? 'Verificando...' : 'Verificar pagamento'}
        </button>
      </div>

      {/* Instruções */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-700">
        <h3 className="font-medium text-blue-800 mb-2">Como pagar com PIX:</h3>
        <ol className="list-decimal list-inside space-y-1 ml-1">
          <li>Abra o aplicativo do seu banco</li>
          <li>Escolha a opção PIX ou pagamento via QR Code</li>
          <li>Escaneie o código acima ou copie a chave PIX</li>
          <li>Confirme as informações e finalize o pagamento</li>
        </ol>
      </div>

      {/* Mensagem de expiração */}
      {expired && (
        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">QR Code expirado</h3>
              <p className="text-sm text-red-700 mt-1">
                Este QR Code expirou. Por favor, recarregue a página para gerar um novo código.
              </p>
              <button 
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                onClick={() => window.location.reload()}
              >
                Gerar Novo QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixPayment;