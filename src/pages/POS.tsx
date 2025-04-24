import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  Receipt,
  CheckCircle,
  Barcode,
  Calculator,
  DollarSign,
  Percent,
  User,
  BarChart2,
  Save,
  Clock,
  FileText,
  Printer,
  Wifi,
  WifiOff,
  BellRing,
  Scan,
  Loader,
  AlertTriangle,
  Undo,
  Eye,
  Menu,
  QrCode
} from 'lucide-react';
import ReactToPrint from 'react-to-print';
import { AutoSizer, List } from 'react-virtualized';
import ScrollContainer from 'react-indiana-drag-scroll';
import { useDebounce } from 'use-debounce';
import useSound from 'use-sound';
import localforage from 'localforage';
import { useCashier } from '../contexts/CashierContext';
import CashierOperations from '../components/pos/CashierOperations';
import PaymentPanel from '../components/pos/PaymentPanel';
import SaleReceipt from '../components/pos/SaleReceipt';
import { useSale } from '../hooks/useSale';
import { useInventory } from '../hooks/useInventory';
import { toast } from 'react-toastify';
import { Product } from '../types/pos';

const POS: React.FC = () => {
  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentStep, setPaymentStep] = useState<'cart' | 'payment' | 'complete'>('cart');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [productScanStatus, setProductScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [focusedProduct, setFocusedProduct] = useState<number | null>(null);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);

  // Audio feedback
  const [playAddSound] = useSound('/sounds/add-item.mp3', { volume: 0.5 });
  const [playRemoveSound] = useSound('/sounds/remove-item.mp3', { volume: 0.5 });
  const [playPaymentComplete] = useSound('/sounds/payment-complete.mp3', { volume: 0.7 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });

  // Get products - in a real app this would come from a database
  // For demonstration, we'll use static data
  const products = [
    { id: '1', sku: 'PF-001', barcode: '7891234567890', name: 'Pão Francês', price: 0.75, category: 'Pães', popular: true, stock_quantity: 120, tax_rate: 7 },
    { id: '2', sku: 'SON-001', barcode: '7891234567891', name: 'Sonho', price: 4.50, category: 'Doces', popular: true, stock_quantity: 45, tax_rate: 7 },
    { id: '3', sku: 'PQ-001', barcode: '7891234567892', name: 'Pão de Queijo', price: 3.50, category: 'Pães', popular: true, stock_quantity: 80, tax_rate: 7 },
    { id: '4', sku: 'CAF-001', barcode: '7891234567893', name: 'Café', price: 3.00, category: 'Bebidas', stock_quantity: 150, tax_rate: 9 },
    { id: '5', sku: 'BCH-001', barcode: '7891234567894', name: 'Bolo de Chocolate', price: 35.00, category: 'Bolos', stock_quantity: 10, tax_rate: 7 },
    { id: '6', sku: 'REF-001', barcode: '7891234567895', name: 'Refrigerante', price: 5.00, category: 'Bebidas', stock_quantity: 60, tax_rate: 9 },
    { id: '7', sku: 'AGU-001', barcode: '7891234567896', name: 'Água Mineral', price: 2.50, category: 'Bebidas', popular: true, stock_quantity: 85, tax_rate: 9 },
    { id: '8', sku: 'CRO-001', barcode: '7891234567897', name: 'Croissant', price: 4.00, category: 'Pães', stock_quantity: 30, tax_rate: 7 },
    { id: '9', sku: 'CP-001', barcode: '7891234567898', name: 'Coxinha de Frango', price: 4.50, category: 'Salgados', popular: true, stock_quantity: 40, tax_rate: 7 },
  ] as Product[];
  
  // Sample order history (would come from database)
  const orderHistory = [
    { id: '1001', date: '16/05/2025 14:32', items: 7, total: 54.50, paymentMethod: 'credit', customer: null },
    { id: '1000', date: '16/05/2025 13:45', items: 4, total: 23.75, paymentMethod: 'cash', customer: {name: 'Maria Silva', document: '123.456.789-00'} },
    { id: '999', date: '16/05/2025 13:10', items: 12, total: 87.30, paymentMethod: 'pix', customer: null },
  ];
  
  // Get cashier context
  const { isSessionOpen } = useCashier();
  
  // Use the sale hook
  const { 
    cartItems,
    customer,
    discount,
    paymentDetails,
    total,
    subtotal,
    discountAmount,
    totalPaid,
    changeAmount,
    completedSale,
    isLoading,
    processingPayment,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateDiscount,
    setCustomer,
    updatePaymentMethod,
    updatePaymentAmount,
    addPaymentMethod,
    removePaymentMethod,
    setCashReceived,
    completeSale,
    canCompleteSale
  } = useSale({
    onSuccess: (message) => {
      toast.success(message);
      playPaymentComplete();
      setPaymentStep('complete');
      
      // Reset after 5 seconds
      setTimeout(() => {
        clearCart();
        setPaymentStep('cart');
      }, 5000);
    },
    onError: (message) => {
      toast.error(message);
      playError();
    }
  });

  // Filter products based on search and category
  const filteredProducts = useCallback(() => {
    let filtered = products;
    
    // Filter by search term
    if (debouncedSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(debouncedSearch))
      );
    } else if (!selectedCategory) {
      // If no search and no category, show popular products
      filtered = filtered.filter(p => p.popular);
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    return filtered;
  }, [products, debouncedSearch, selectedCategory]);

  // Get unique product categories
  const productCategories = Array.from(
    new Set(products.map(p => p.category))
  ).sort();
  
  // Focus handlers
  const handleSearchFocus = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleBarcodeInputFocus = useCallback(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Handle barcode search
  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    setProductScanStatus('scanning');
    setTimeout(() => {
      const product = products.find(p => p.barcode === barcodeInput);
      if (product) {
        addToCart(product as any);
        setBarcodeInput('');
        setProductScanStatus('success');
        playAddSound();
        setTimeout(() => setProductScanStatus('idle'), 1000);
      } else {
        playError();
        setProductScanStatus('error');
        setTimeout(() => setProductScanStatus('idle'), 1500);
      }
    }, 300); // Simulate barcode scanning delay
  }, [barcodeInput, products, addToCart, playError, playAddSound]);

  // Handle completing the payment process
  const handleCompletePayment = async () => {
    await completeSale('nfce');
  };
  
  // Effect for barcode input focus on mount
  useEffect(() => {
    handleBarcodeInputFocus();
    
    // Check network status
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize network status
    setOfflineMode(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleBarcodeInputFocus]);
  
  // Start a new sale
  const startNewSale = useCallback(() => {
    clearCart();
    setSearchQuery('');
    setPaymentStep('cart');
    handleBarcodeInputFocus();
  }, [clearCart, handleBarcodeInputFocus]);
  
  // Virtual list row renderer for cart items
  const rowRenderer = useCallback(({ index, key, style }: any) => {
    const item = cartItems[index];
    if (!item) return null;
    
    return (
      <div key={key} style={style} className="px-4 relative">
        <div 
          className={`p-3 my-2 bg-white rounded-lg border ${showItemMenu === item.id ? 'border-primary' : 'border-gray-200'} shadow-sm`}
          onMouseEnter={() => setShowItemMenu(item.id)}
          onMouseLeave={() => setShowItemMenu(null)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-lg">{item.product_name}</h3>
              <div className="flex items-center mt-1 text-gray-600">
                <span className="text-xs bg-gray-100 px-1 py-0.5 rounded mr-2">{item.product_sku}</span>
                <span className="text-xs">Unitário: {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(item.unit_price)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(item.total)}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >
                <Minus className="h-4 w-4 text-gray-700" />
              </button>
              <span className="font-medium text-lg w-10 text-center">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >
                <Plus className="h-4 w-4 text-gray-700" />
              </button>
            </div>
            
            <button 
              onClick={() => {
                playRemoveSound();
                removeFromCart(item.id);
              }}
              className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600"
              aria-label="Remover item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          {/* Item Action Menu (shown on hover) */}
          {showItemMenu === item.id && (
            <div className="absolute top-2 right-2 bg-white shadow-md rounded-md border border-gray-200 z-10">
              <div className="p-1">
                <button 
                  className="flex items-center px-3 py-1 text-sm hover:bg-gray-100 w-full text-left rounded"
                  onClick={() => {
                    // Add discount for this item
                    alert('Funcionalidade de desconto por item em desenvolvimento');
                  }}
                >
                  <Percent className="h-4 w-4 mr-2 text-yellow-600" />
                  Desconto
                </button>
                <button 
                  className="flex items-center px-3 py-1 text-sm hover:bg-gray-100 w-full text-left rounded"
                  onClick={() => {
                    // View product details
                    alert('Funcionalidade de detalhes do produto em desenvolvimento');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2 text-blue-600" />
                  Detalhes
                </button>
                <button 
                  className="flex items-center px-3 py-1 text-sm hover:bg-gray-100 w-full text-left rounded"
                  onClick={() => {
                    playRemoveSound();
                    removeFromCart(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                  Remover
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [cartItems, updateQuantity, removeFromCart, playRemoveSound, showItemMenu]);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-100">
      {/* Left side - Cart */}
      <div className="w-2/3 flex flex-col overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-white p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img 
                src="https://i.ibb.co/C2f9T3D/casa-dos-paes-logo.png" 
                alt="Casa dos Pães" 
                className="h-14 mr-3"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-amber-600">Casa dos Pães</h1>
                <p className="text-sm text-gray-600">Panificadora e Confeitaria</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Network status indicator */}
              <div className="mr-2">
                {offlineMode ? (
                  <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-lg text-sm">
                    <WifiOff className="h-4 w-4 mr-1" />
                    Offline
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">
                    <Wifi className="h-4 w-4 mr-1" />
                    Online
                  </div>
                )}
              </div>
              
              {/* Session status */}
              <div className="mr-2">
                {isSessionOpen ? (
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Caixa Aberto
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Caixa Fechado
                  </div>
                )}
              </div>
              
              {/* Customer selector */}
              {customer ? (
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  <User className="h-4 w-4" />
                  <div>
                    <span className="font-medium">{customer.name}</span>
                    {customer.points !== undefined && (
                      <span className="text-xs ml-2">({customer.points} pontos)</span>
                    )}
                  </div>
                  <button 
                    onClick={() => setCustomer(null)}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button 
                  className="btn-outline py-1.5 px-3 text-sm"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Cliente (F7)
                </button>
              )}
              
              {/* Cashier operations button */}
              <button 
                className="btn-outline py-1.5 px-3 text-sm"
                onClick={() => setShowCashierModal(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Operações de Caixa
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex">
              <div className="relative flex-1">
                <Scan className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  productScanStatus === 'scanning' ? 'text-blue-500 animate-pulse' : 
                  productScanStatus === 'success' ? 'text-green-500' : 
                  productScanStatus === 'error' ? 'text-red-500' : 
                  'text-gray-400'
                }`} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="input pl-10 pr-10 w-full border-2 focus:border-primary focus:ring-primary"
                  placeholder="Leitura de código de barras (F5)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeSubmit(e);
                    }
                  }}
                  autoComplete="off"
                />
                {barcodeInput && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setBarcodeInput('')}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button type="submit" className="ml-2 btn-primary py-2">
                <Search className="h-4 w-4" />
              </button>
            </form>
            
            <div className="flex space-x-1">
              <button 
                className="btn-outline py-1.5 px-3 text-sm"
                onClick={() => {
                  if (cartItems.length > 0) {
                    const lastItem = cartItems[cartItems.length - 1];
                    playRemoveSound();
                    removeFromCart(lastItem.id);
                  }
                }}
                disabled={cartItems.length === 0}
              >
                <Undo className="h-4 w-4 mr-1" />
                Último Item
              </button>
              
              <button 
                className="btn-outline py-1.5 px-3 text-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                onClick={() => {
                  if (cartItems.length > 0 && confirm('Deseja cancelar esta venda?')) {
                    clearCart();
                  }
                }}
                disabled={cartItems.length === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </button>
              
              <button 
                className="btn-primary py-1.5 px-3 text-sm"
                onClick={() => cartItems.length > 0 && setPaymentStep('payment')}
                disabled={cartItems.length === 0}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Pagamento
              </button>
            </div>
          </div>

          {/* Product search input */}
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="input pl-10 pr-3 w-full"
                placeholder="Buscar produto por nome ou código (F4)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-hidden flex">
          {/* Cart Items List */}
          <div className="w-3/5 overflow-hidden">
            {/* Item list with virtualized scrolling for performance */}
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
                <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-xl font-medium">Carrinho vazio</p>
                <p className="mt-2">Adicione produtos para iniciar uma venda</p>
                <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-lg max-w-sm">
                  <p className="font-medium">Atalhos de teclado:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• <strong>F4</strong>: Busca de produtos</li>
                    <li>• <strong>F5</strong>: Leitura de código de barras</li>
                    <li>• <strong>F7</strong>: Selecionar cliente</li>
                    <li>• <strong>F12</strong>: Histórico de vendas</li>
                    <li>• <strong>ESC</strong>: Cancelar/Voltar</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full">
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      width={width}
                      height={height}
                      rowCount={cartItems.length}
                      rowHeight={140}
                      rowRenderer={rowRenderer}
                      overscanRowCount={3}
                    />
                  )}
                </AutoSizer>
              </div>
            )}
          </div>
          
          {/* Right side - Totals and Payment Options */}
          <div className="w-2/5 flex flex-col border-l border-gray-200">
            {paymentStep === 'payment' ? (
              /* Payment panel */
              <PaymentPanel 
                total={total}
                paymentMethods={paymentDetails}
                onUpdateMethod={updatePaymentMethod}
                onUpdateAmount={updatePaymentAmount}
                onAddMethod={addPaymentMethod}
                onRemoveMethod={removePaymentMethod}
                onSetCashReceived={setCashReceived}
                onCompletePayment={handleCompletePayment}
                canComplete={canCompleteSale}
                isLoading={isLoading || processingPayment}
                error={error}
              />
            ) : (
              /* Order summary */
              <div className="flex flex-col h-full bg-white">
                {/* Order total and details */}
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Venda</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex">
                        <span className="text-gray-600">Desconto:</span>
                        
                        {/* Discount selector */}
                        <div className="ml-2 flex items-center space-x-1">
                          <select
                            value={discount.type}
                            onChange={(e) => updateDiscount(e.target.value as any, discount.value)}
                            className="text-xs border rounded-md py-0.5 px-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="percentage">%</option>
                            <option value="value">R$</option>
                            {customer?.points && <option value="points">Pontos</option>}
                          </select>
                          <input 
                            type="number"
                            value={discount.value || ''}
                            onChange={(e) => updateDiscount(
                              discount.type, 
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-12 text-xs border rounded-md py-0.5 px-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            min="0"
                            step={discount.type === 'percentage' ? '1' : '0.01'}
                          />
                        </div>
                      </div>
                      
                      <span className={`font-medium ${discountAmount > 0 ? 'text-red-600' : ''}`}>
                        {discountAmount > 0 ? '-' : ''}{new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(discountAmount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">{new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(total)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Add customer and discount buttons */}
                <div className="p-4 border-b">
                  <div className="flex space-x-2">
                    <button 
                      className="btn-outline py-1.5 flex-1 text-sm"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {customer ? 'Alterar Cliente' : 'Adicionar Cliente'}
                    </button>
                    
                    {customer?.discount_rate && discount.value === 0 && (
                      <button 
                        className="btn-outline py-1.5 flex-1 text-sm bg-green-50 border-green-200 text-green-700"
                        onClick={() => updateDiscount('percentage', customer.discount_rate)}
                      >
                        <Percent className="h-4 w-4 mr-2" />
                        Aplicar {customer.discount_rate}%
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Quick payment buttons */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Pagamento Rápido</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      className="btn-outline py-2 flex items-center justify-center"
                      onClick={() => {
                        if (cartItems.length > 0) {
                          // Set up cash payment for the full amount
                          setCashReceived(total);
                          setPaymentStep('payment');
                        }
                      }}
                      disabled={cartItems.length === 0}
                    >
                      <Banknote className="h-5 w-5 mr-2 text-green-600" />
                      Dinheiro
                    </button>
                    
                    <button 
                      className="btn-outline py-2 flex items-center justify-center"
                      onClick={() => {
                        if (cartItems.length > 0) {
                          // Set up credit card payment
                          updatePaymentMethod(0, 'credit');
                          updatePaymentAmount(0, total);
                          setPaymentStep('payment');
                        }
                      }}
                      disabled={cartItems.length === 0}
                    >
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      Cartão
                    </button>
                    
                    <button 
                      className="btn-outline py-2 flex items-center justify-center"
                      onClick={() => {
                        if (cartItems.length > 0) {
                          // Set up PIX payment
                          updatePaymentMethod(0, 'pix');
                          updatePaymentAmount(0, total);
                          setPaymentStep('payment');
                        }
                      }}
                      disabled={cartItems.length === 0}
                    >
                      <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                      PIX
                    </button>
                    
                    <button 
                      className="btn-outline py-2 flex items-center justify-center"
                      onClick={() => {
                        if (cartItems.length > 0) {
                          setPaymentStep('payment');
                        }
                      }}
                      disabled={cartItems.length === 0}
                    >
                      <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                      Múltiplos
                    </button>
                  </div>
                </div>
                
                {/* Function buttons */}
                <div className="mt-auto p-4 border-t">
                  <div className="flex justify-between space-x-2">
                    <button 
                      className="btn-outline py-2 text-sm flex-1 flex items-center justify-center"
                      onClick={() => setIsOrderHistoryOpen(true)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Histórico
                    </button>
                    
                    <ReactToPrint
                      trigger={() => (
                        <button className="btn-outline py-2 text-sm flex-1 flex items-center justify-center">
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </button>
                      )}
                      content={() => receiptRef.current}
                    />
                  </div>
                  
                  <button
                    className="btn-primary py-2 w-full mt-3"
                    onClick={() => cartItems.length > 0 && setPaymentStep('payment')}
                    disabled={cartItems.length === 0}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Product Selection */}
      <div className="w-1/3 flex flex-col overflow-hidden border-l border-gray-200">
        {/* Categories */}
        <div className="bg-white p-2 border-b">
          <ScrollContainer className="scroll-container cursor-grab" hideScrollbars={false}>
            <div className="flex space-x-2 min-w-max">
              <button
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  !selectedCategory ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Populares
              </button>
              
              {productCategories.map((category, index) => (
                <button
                  key={index}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollContainer>
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-2 text-gray-600">Carregando produtos...</span>
            </div>
          ) : filteredProducts().length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts().map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => {
                    addToCart(product);
                    playAddSound();
                  }}
                  className={`p-3 bg-white rounded-lg border ${
                    focusedProduct === index ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="bg-gray-100 px-1 py-0.5 rounded mr-1">{product.sku}</span>
                        {product.category}
                      </p>
                      {product.stock_quantity < 10 && (
                        <p className="text-xs text-amber-600">Estoque: {product.stock_quantity}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary mt-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-xl font-medium">Nenhum produto encontrado</p>
              <p className="mt-2">Tente outro termo de busca ou categoria</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Success Completion Modal */}
      {paymentStep === 'complete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Venda Concluída!</h3>
              <p className="text-gray-600 mb-4">
                Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(completedSale?.total || 0)} • 
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
              </p>
              
              {completedSale?.payment_details?.some(pd => 
                pd.method === 'cash' && pd.received_amount && pd.received_amount > pd.amount
              ) && (
                <div className="bg-green-100 rounded-lg p-3 mb-4">
                  <div className="text-green-800 font-medium">
                    Valor recebido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      completedSale.payment_details.find(pd => 
                        pd.method === 'cash' && pd.received_amount
                      )?.received_amount || 0
                    )}
                  </div>
                  <div className="text-green-800 font-bold text-xl mt-1">
                    Troco: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(changeAmount)}
                  </div>
                </div>
              )}
              
              {customer && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 font-medium flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Cliente: {customer.name}
                  </p>
                  {customer.points !== undefined && (
                    <p className="text-blue-800 text-sm mt-1">
                      + {Math.floor((completedSale?.total || 0) / 10)} pontos adicionados
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-4 mt-6">
                <ReactToPrint
                  trigger={() => (
                    <button className="btn-outline py-2 flex-1">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Cupom
                    </button>
                  )}
                  content={() => receiptRef.current}
                />
                <button 
                  className="btn-primary py-2 flex-1"
                  onClick={startNewSale}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Nova Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Customer Selection Modal (placeholder) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10 w-full"
                  placeholder="Buscar cliente por nome, documento ou telefone"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-center text-gray-500">
                A funcionalidade de cadastro de clientes está em implementação.
              </p>
              <p className="text-center text-gray-500 mt-2">
                Clique em "Selecionar" para usar um cliente de exemplo.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-outline"
                onClick={() => setShowCustomerModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  // Set demo customer
                  setCustomer({
                    id: '1',
                    name: 'Maria Silva',
                    document_type: 'cpf',
                    document_number: '123.456.789-00',
                    points: 120,
                    discount_rate: 5,
                    is_active: true,
                    created_at: '',
                    updated_at: ''
                  });
                  setShowCustomerModal(false);
                  
                  // Toast notification
                  toast.success('Cliente selecionado');
                }}
              >
                Selecionar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cashier Operations Modal */}
      {showCashierModal && (
        <CashierOperations onClose={() => setShowCashierModal(false)} />
      )}
      
      {/* Hidden Receipt Template for Printing */}
      <div className="hidden">
        <SaleReceipt
          ref={receiptRef}
          sale={completedSale}
          items={cartItems}
          logoUrl="https://i.ibb.co/C2f9T3D/casa-dos-paes-logo.png"
        />
      </div>
    </div>
  );
};

export default POS;