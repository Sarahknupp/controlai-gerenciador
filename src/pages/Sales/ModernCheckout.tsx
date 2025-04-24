import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash, 
  User, 
  Tag,
  ChevronLeft, 
  CreditCard, 
  Banknote, 
  QrCode, 
  FileText,
  Receipt, 
  ArrowRight, 
  DollarSign,
  Percent,
  Edit,
  Check,
  X,
  AlertTriangle,
  Clock,
  Printer,
  Settings,
  Palette,
  Monitor,
  Moon,
  Sun,
  Save,
  Undo
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCashier } from '../../contexts/CashierContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import ReactToPrint from 'react-to-print';
import SaleReceipt from '../../components/pos/SaleReceipt';
import { Product, Sale, SaleItem, Customer, PaymentDetails } from '../../types/pos';
import FiscalDocumentButton from '../../components/FiscalDocumentButton';
import ThemeCustomizer from '../../components/ThemeCustomizer';
import { toast } from 'react-toastify';

/**
 * Modern POS Checkout interface with an optimized user experience
 */
const ModernCheckout: React.FC = () => {
  // Auth and cashier contexts
  const { user } = useAuth();
  const { currentSession, isSessionOpen } = useCashier();
  const { preferences } = useUserPreferences();
  
  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState<{type: 'percentage'|'value', amount: number}>({ type: 'percentage', amount: 0 });
  
  // UI state
  const [currentView, setCurrentView] = useState<'cart'|'payment'|'receipt'|'fiscal'>('cart');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card'|'cash'|'pix'|null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  
  // Sample products data (in a real app, this would come from a database)
  const products: Product[] = [
    { id: '1', sku: 'PF001', name: 'Pão Francês', price: 0.75, category_id: 'breads', unit: 'un', barcode: '7891234500001', stock_quantity: 150, tax_rate: 0, cost_price: 0.3, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '2', sku: 'PQ001', name: 'Pão de Queijo', price: 3.50, category_id: 'breads', unit: 'un', barcode: '7891234500002', stock_quantity: 80, tax_rate: 0, cost_price: 1.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '3', sku: 'CAF001', name: 'Café', price: 3.00, category_id: 'drinks', unit: 'un', barcode: '7891234500003', stock_quantity: 120, tax_rate: 0, cost_price: 1.2, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '09011110', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '4', sku: 'SUCO001', name: 'Suco Natural', price: 6.00, category_id: 'drinks', unit: 'un', barcode: '7891234500004', stock_quantity: 50, tax_rate: 0, cost_price: 2.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '20091900', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '5', sku: 'BOLO001', name: 'Bolo de Chocolate', price: 5.00, category_id: 'desserts', unit: 'un', barcode: '7891234500005', stock_quantity: 25, tax_rate: 0, cost_price: 2, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '6', sku: 'SAND001', name: 'Sanduíche Natural', price: 8.50, category_id: 'snacks', unit: 'un', barcode: '7891234500006', stock_quantity: 30, tax_rate: 0, cost_price: 3.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '16023200', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
  ];
  
  // Categories
  const categories = [
    { id: 'breads', name: 'Pães' },
    { id: 'drinks', name: 'Bebidas' },
    { id: 'desserts', name: 'Doces' },
    { id: 'snacks', name: 'Lanches' }
  ];
  
  // Cart calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discount.type === 'percentage' 
    ? subtotal * (discount.amount / 100) 
    : Math.min(discount.amount, subtotal);
  const total = subtotal - discountAmount;
  
  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    
    // Load recent products
    const recentProductIds = ['1', '2', '6']; // In a real app, get these from analytics
    setRecentProducts(products.filter(p => recentProductIds.includes(p.id)));
  }, []);
  
  // Handle barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      addToCart(product);
      setBarcodeInput('');
      
      // Refocus barcode input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } else {
      alert("Produto não encontrado");
    }
  };
  
  // Filter products by search or category
  const filteredProducts = () => {
    if (searchQuery) {
      return products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
      );
    }
    
    if (selectedCategory) {
      return products.filter(p => p.category_id === selectedCategory);
    }
    
    return recentProducts;
  };
  
  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      // Check if product already in cart
      const existingItemIndex = prev.findIndex(item => item.product_id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prev];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = product.price * newQuantity;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal
        };
        
        return updatedItems;
      } else {
        // Add new item
        const newItem: SaleItem = {
          id: `temp-${Date.now()}-${product.id}`,
          sale_id: '',
          product_id: product.id,
          product_sku: product.sku,
          product_name: product.name,
          quantity,
          unit_price: product.price,
          discount: 0,
          total: product.price * quantity,
          tax_rate: 0,
          tax_amount: 0
        };
        
        return [...prev, newItem];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const product = products.find(p => p.id === item.product_id);
          if (!product) return item;
          
          return {
            ...item,
            quantity: newQuantity,
            total: product.price * newQuantity
          };
        }
        return item;
      });
    });
  };
  
  // Handle discount application
  const applyDiscount = () => {
    setShowDiscountPanel(false);
  };
  
  // Clear cart
  const clearCart = () => {
    if (window.confirm('Deseja limpar o carrinho?')) {
      setCartItems([]);
      setDiscount({ type: 'percentage', amount: 0 });
      setCustomer(null);
      setNote('');
    }
  };
  
  // Process payment
  const processPayment = () => {
    if (cartItems.length === 0) return;
    if (!isSessionOpen) {
      alert("É necessário abrir o caixa primeiro!");
      return;
    }
    
    setIsProcessingPayment(true);
    
    setTimeout(() => {
      // In a real app, this would call an API to process the payment
      const now = new Date().toISOString();
      
      // Create payment details based on selected method
      let paymentDetails: PaymentDetails[] = [];
      
      switch (paymentMethod) {
        case 'card':
          paymentDetails = [{
            method: 'credit',
            amount: total,
            integration: {
              transaction_id: `txn_${Date.now()}`,
              authorization_code: '123456'
            }
          }];
          break;
        case 'cash':
          paymentDetails = [{
            method: 'cash',
            amount: total,
            received_amount: Math.ceil(total / 5) * 5, // Round up to nearest 5
            change_amount: Math.ceil(total / 5) * 5 - total
          }];
          break;
        case 'pix':
          paymentDetails = [{
            method: 'pix',
            amount: total,
            integration: {
              transaction_id: `pix_${Date.now()}`
            }
          }];
          break;
        default:
          paymentDetails = [{
            method: 'cash',
            amount: total
          }];
      }
      
      // Create completed sale
      const newSale: Sale = {
        id: `sale_${Date.now()}`,
        operator_id: user?.id || '',
        terminal_id: 'web-terminal',
        cashier_session_id: currentSession?.id || '',
        subtotal: subtotal,
        discount_amount: discountAmount,
        discount_type: discount.type,
        discount_reason: discount.amount > 0 ? 'Manual discount' : '',
        tax_amount: 0,
        total: total,
        status: 'completed',
        payment_details: paymentDetails,
        created_at: now,
        completed_at: now,
        notes: note,
        customer: customer
      };
      
      setCompletedSale(newSale);
      setCurrentView('receipt');
      setIsProcessingPayment(false);
    }, 2000); // Simulate processing delay
  };
  
  // Start new sale
  const startNewSale = () => {
    setCartItems([]);
    setDiscount({ type: 'percentage', amount: 0 });
    setCustomer(null);
    setNote('');
    setCurrentView('cart');
    setPaymentMethod(null);
    setCompletedSale(null);
    
    // Refocus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Customer display component
  const CustomerDisplay = () => {
    if (!customer) return null;
    
    return (
      <div className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full max-w-fit">
        <User className="h-3 w-3 mr-1" /> 
        <span className="truncate max-w-[120px]">{customer.name}</span>
        <button className="ml-1 text-blue-700" onClick={() => setCustomer(null)}>
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };

  // Render component based on current view
  switch (currentView) {
    case 'payment':
      return (
        <div className={`min-h-screen ${preferences.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          {/* Header */}
          <header className={`${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm px-4 py-3 flex items-center border-b`}>
            <button 
              className={`mr-4 ${preferences.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentView('cart')}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className={`text-xl font-semibold ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pagamento</h1>
            
            <button 
              className={`ml-auto p-2 rounded-full ${preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => setShowThemeCustomizer(true)}
              aria-label="Personalizar aparência"
            >
              <Settings className="h-5 w-5" />
            </button>
          </header>
          
          {/* Payment content */}
          <div className="container mx-auto p-4 max-w-5xl">
            <div className={`rounded-lg shadow p-6 mb-6 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(total)}</h2>
                  <p className={`${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</p>
                </div>
                {customer && <CustomerDisplay />}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                  className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    paymentMethod === 'card' 
                      ? `border-primary bg-primary/5 ${preferences.theme === 'dark' ? 'text-white' : ''}` 
                      : `${preferences.theme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className={`h-10 w-10 mb-2 ${paymentMethod === 'card' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'card' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Cartão</span>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    paymentMethod === 'pix' 
                      ? `border-primary bg-primary/5 ${preferences.theme === 'dark' ? 'text-white' : ''}` 
                      : `${preferences.theme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`
                  }`}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <QrCode className={`h-10 w-10 mb-2 ${paymentMethod === 'pix' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'pix' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>PIX</span>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    paymentMethod === 'cash' 
                      ? `border-primary bg-primary/5 ${preferences.theme === 'dark' ? 'text-white' : ''}` 
                      : `${preferences.theme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className={`h-10 w-10 mb-2 ${paymentMethod === 'cash' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'cash' ? 'text-primary' : preferences.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Dinheiro</span>
                </div>
              </div>
              
              {/* Payment details based on selected method */}
              {paymentMethod && (
                <>
                  {paymentMethod === 'card' && (
                    <div className={`border rounded-lg p-6 ${preferences.theme === 'dark' ? 'border-gray-700 bg-gray-800' : ''}`}>
                      <h3 className={`font-medium text-lg mb-4 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Pagamento com Cartão</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</label>
                            <select className={`input w-full ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                              <option value="credit">Crédito</option>
                              <option value="debit">Débito</option>
                            </select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Parcelas</label>
                            <select className={`input w-full ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                              <option value="1">1x (à vista)</option>
                              <option value="2">2x sem juros</option>
                              <option value="3">3x sem juros</option>
                            </select>
                          </div>
                        </div>
                        <p className={preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
                          Insira ou aproxime o cartão na máquina e siga as instruções.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'pix' && (
                    <div className={`border rounded-lg p-6 ${preferences.theme === 'dark' ? 'border-gray-700 bg-gray-800' : ''}`}>
                      <h3 className={`font-medium text-lg mb-4 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Pagamento com PIX</h3>
                      <div className="flex flex-col items-center mb-4">
                        <div className={`p-4 border rounded-lg ${preferences.theme === 'dark' ? 'border-gray-600 bg-white' : 'bg-white'}`}>
                          <QrCode className="h-40 w-40 text-gray-800" />
                        </div>
                      </div>
                      <p className={`text-center mb-4 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        Escaneie o QR Code acima com o app do seu banco para pagar.
                      </p>
                    </div>
                  )}
                  
                  {paymentMethod === 'cash' && (
                    <div className={`border rounded-lg p-6 ${preferences.theme === 'dark' ? 'border-gray-700 bg-gray-800' : ''}`}>
                      <h3 className={`font-medium text-lg mb-4 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Pagamento em Dinheiro</h3>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Valor Recebido</label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>R$</span>
                            </div>
                            <input
                              type="number"
                              min={total}
                              step="0.01"
                              className={`input pl-10 ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                              placeholder="0.00"
                              defaultValue={Math.ceil(total / 5) * 5} // Round up to nearest 5
                            />
                          </div>
                        </div>
                        
                        <div className={`grid grid-cols-4 gap-2 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>
                          {[5, 10, 20, 50, 100].map(amount => (
                            <button 
                              key={amount}
                              className={`p-2 border rounded text-center ${preferences.theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                            >
                              {formatCurrency(amount)}
                            </button>
                          ))}
                        </div>
                        
                        <div className={`border-t pt-3 mt-3 ${preferences.theme === 'dark' ? 'border-gray-600' : ''}`}>
                          <div className="flex justify-between">
                            <span className={preferences.theme === 'dark' ? 'text-gray-300' : ''}>Valor da Compra:</span>
                            <span className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>{formatCurrency(total)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={preferences.theme === 'dark' ? 'text-gray-300' : ''}>Valor Recebido:</span>
                            <span className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>{formatCurrency(Math.ceil(total / 5) * 5)}</span>
                          </div>
                          <div className="flex justify-between mt-1 text-lg font-bold">
                            <span className={preferences.theme === 'dark' ? 'text-gray-100' : ''}>Troco:</span>
                            <span className={preferences.theme === 'dark' ? 'text-green-400' : ''}>{formatCurrency(Math.ceil(total / 5) * 5 - total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-6 flex justify-end">
                <button 
                  className={`px-6 py-3 rounded-lg font-medium ${
                    !paymentMethod || isProcessingPayment
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                  onClick={processPayment}
                  disabled={!paymentMethod || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 inline-block border-2 border-white border-t-transparent rounded-full"></div>
                      Processando...
                    </>
                  ) : (
                    <>Finalizar Pagamento</>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Theme customizer modal */}
          {showThemeCustomizer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg max-w-2xl w-full`}>
                <div className={`flex items-center justify-between p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-xl font-semibold">Personalizar Aparência</h3>
                  <button onClick={() => setShowThemeCustomizer(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
              </div>
            </div>
          )}
        </div>
      );
      
    case 'receipt':
      return (
        <div className={`min-h-screen ${preferences.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          {/* Header */}
          <header className={`${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm px-4 py-3 flex items-center border-b`}>
            <h1 className={`text-xl font-semibold ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Comprovante de Venda</h1>
            
            <button 
              className={`ml-auto p-2 rounded-full ${preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => setShowThemeCustomizer(true)}
              aria-label="Personalizar aparência"
            >
              <Settings className="h-5 w-5" />
            </button>
          </header>
          
          {/* Receipt content */}
          <div className="container mx-auto p-4 max-w-3xl">
            <div className={`rounded-lg shadow p-6 mb-6 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-center mb-8">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${preferences.theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                  <Check className={`h-8 w-8 ${preferences.theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Venda Finalizada!</h2>
                <p className={`text-lg ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                  {formatCurrency(total)} • {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                </p>
                
                {paymentMethod === 'cash' && (
                  <div className="mt-3">
                    <div className={`inline-block px-4 py-2 rounded-lg ${preferences.theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`}>
                      <p>
                        <span className="font-medium">Troco:</span> {formatCurrency(Math.ceil(total / 5) * 5 - total)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <ReactToPrint
                  trigger={() => (
                    <button className={`flex-1 py-3 flex items-center justify-center ${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                        : 'btn-outline'
                    }`}>
                      <Printer className="h-5 w-5 mr-2" />
                      Imprimir Comprovante
                    </button>
                  )}
                  content={() => receiptRef.current}
                />
                
                <button 
                  className="flex-1 btn-primary py-3 flex items-center justify-center"
                  onClick={() => setCurrentView('fiscal')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Emitir Nota Fiscal
                </button>
              </div>
              
              <button 
                className={`w-full mt-6 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-primary'}`}
                onClick={startNewSale}
              >
                Iniciar Nova Venda
              </button>
            </div>
            
            {/* Hidden receipt for printing */}
            <div className="hidden">
              <SaleReceipt
                ref={receiptRef}
                sale={completedSale}
                items={cartItems}
              />
            </div>
          </div>
          
          {/* Theme customizer modal */}
          {showThemeCustomizer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg max-w-2xl w-full`}>
                <div className={`flex items-center justify-between p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-xl font-semibold">Personalizar Aparência</h3>
                  <button onClick={() => setShowThemeCustomizer(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
              </div>
            </div>
          )}
        </div>
      );
      
    case 'fiscal':
      return (
        <div className={`min-h-screen ${preferences.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          {/* Header */}
          <header className={`${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm px-4 py-3 flex items-center border-b`}>
            <button 
              className={`mr-4 ${preferences.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentView('receipt')}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className={`text-xl font-semibold ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Documento Fiscal</h1>
            
            <button 
              className={`ml-auto p-2 rounded-full ${preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => setShowThemeCustomizer(true)}
              aria-label="Personalizar aparência"
            >
              <Settings className="h-5 w-5" />
            </button>
          </header>
          
          {/* Fiscal document content */}
          <div className="container mx-auto p-4 max-w-3xl">
            <div className={`rounded-lg shadow p-6 mb-6 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Emissão de Documento Fiscal</h2>
              
              <div className="space-y-6">
                <p className={preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Selecione o tipo de documento fiscal que deseja emitir para esta venda:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 hover:border-primary cursor-pointer ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>NFC-e</h3>
                      <FileText className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      Nota Fiscal de Consumidor Eletrônica, ideal para vendas a consumidor final.
                    </p>
                    <button className={`w-full mt-4 btn-primary py-2 text-sm ${preferences.theme === 'dark' ? 'bg-opacity-90 hover:bg-opacity-100' : ''}`}>
                      Emitir NFC-e
                    </button>
                  </div>
                  
                  <div className={`border rounded-lg p-4 hover:border-primary cursor-pointer ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>NF-e</h3>
                      <FileText className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      Nota Fiscal Eletrônica, para vendas a empresas ou quando solicitado pelo cliente.
                    </p>
                    <button className={`w-full mt-4 btn-outline py-2 text-sm ${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500' 
                        : ''
                    }`}>
                      Emitir NF-e
                    </button>
                  </div>
                </div>
                
                {!customer && (
                  <div className={`border rounded-lg p-4 ${
                    preferences.theme === 'dark' 
                      ? 'bg-yellow-900/30 border-yellow-800/50 text-yellow-200' 
                      : 'bg-yellow-50 border-yellow-100'
                  }`}>
                    <div className="flex">
                      <AlertTriangle className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'} mt-0.5 mr-2 flex-shrink-0`} />
                      <div>
                        <p className={preferences.theme === 'dark' ? 'text-yellow-200' : 'text-sm text-yellow-700'}>
                          Nenhum cliente selecionado. Para NF-e é necessário informar o cliente.
                        </p>
                        <button className="mt-2 text-sm font-medium text-primary">
                          Adicionar Cliente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button 
                  className={`py-2 px-4 rounded ${
                    preferences.theme === 'dark' 
                      ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                      : 'btn-outline'
                  }`}
                  onClick={() => setCurrentView('receipt')}
                >
                  Voltar
                </button>
                
                <button 
                  className="btn-primary py-2 px-4"
                  onClick={startNewSale}
                >
                  Concluir e Iniciar Nova Venda
                </button>
              </div>
            </div>
          </div>
          
          {/* Theme customizer modal */}
          {showThemeCustomizer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg max-w-2xl w-full`}>
                <div className={`flex items-center justify-between p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-xl font-semibold">Personalizar Aparência</h3>
                  <button onClick={() => setShowThemeCustomizer(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
              </div>
            </div>
          )}
        </div>
      );
      
    default: // 'cart' view
      return (
        <div className={`min-h-screen ${preferences.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'} transition-colors duration-200`}>
          {/* Header */}
          <header className={`${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm px-4 py-3 border-b transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <Link to="/sales" className={`mr-4 ${preferences.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className={`text-xl font-semibold ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Checkout</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {!isSessionOpen && (
                  <div className={`flex items-center text-red-600 text-sm ${preferences.theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50'} px-2 py-1 rounded`}>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Caixa Fechado
                  </div>
                )}
                
                <CustomerDisplay />
                
                <button 
                  className={`p-2 rounded-full ${preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setShowAddCustomer(true)}
                >
                  <User className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
                
                <button 
                  className={`p-2 rounded-full ${preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setShowThemeCustomizer(true)}
                  aria-label="Personalizar aparência"
                >
                  {preferences.theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-gray-300" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 flex flex-col md:flex-row">
            {/* Left Panel - Cart */}
            <div className={`md:w-3/5 border-r ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
              {/* Barcode scanner */}
              <div className={`p-4 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <form onSubmit={handleBarcodeSubmit} className="flex">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Scan className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      className={`input pl-10 w-full py-3 ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500' 
                          : ''
                      }`}
                      placeholder="Escaneie o código de barras"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className={`ml-2 ${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white px-3' 
                        : 'btn-outline px-3'
                    }`}
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
              </div>
              
              {/* Cart items */}
              <div className={`flex-1 overflow-y-auto p-4 ${preferences.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingCart className={`h-20 w-20 mb-4 ${preferences.theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
                    <h3 className={`text-xl font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Carrinho vazio</h3>
                    <p className={`text-center max-w-sm ${preferences.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Adicione produtos escaneando o código de barras ou selecionando-os no painel ao lado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex items-center p-3 rounded-lg ${
                          preferences.theme === 'dark' 
                            ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
                            : 'bg-white border hover:shadow-sm'
                        }`}
                      >
                        <div className="flex-1">
                          <h3 className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.product_name}</h3>
                          <p className={`${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                            {formatCurrency(item.unit_price)} • {item.product_sku}
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex items-center mr-4">
                            <button 
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                preferences.theme === 'dark' 
                                  ? 'bg-gray-700 hover:bg-gray-600' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className={`mx-3 font-medium w-5 text-center ${preferences.theme === 'dark' ? 'text-white' : ''}`}>{item.quantity}</span>
                            <button 
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                preferences.theme === 'dark' 
                                  ? 'bg-gray-700 hover:bg-gray-600' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center">
                            <span className={`font-medium mr-3 ${preferences.theme === 'dark' ? 'text-white' : ''}`}>{formatCurrency(item.total)}</span>
                            <button 
                              className={`${preferences.theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Cart actions */}
              <div className={`p-4 border-t ${
                preferences.theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <button 
                      className={`py-2 px-3 rounded border ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                          : 'btn-outline text-sm'
                      }`}
                      onClick={() => setShowAddCustomer(true)}
                    >
                      {customer ? 'Alterar Cliente' : 'Cliente'}
                    </button>
                    
                    <button 
                      className={`py-2 px-3 rounded border ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                          : 'btn-outline text-sm'
                      }`}
                      onClick={() => setShowDiscountPanel(true)}
                    >
                      <Percent className="h-4 w-4 mr-1 inline" />
                      {discount.amount > 0 ? `${discount.amount}${discount.type === 'percentage' ? '%' : ''} Off` : 'Desconto'}
                    </button>
                    
                    <button 
                      className={`py-2 px-3 rounded border ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                          : 'btn-outline text-sm'
                      }`}
                      onClick={() => {
                        const newNote = prompt('Observações:', note);
                        if (newNote !== null) {
                          setNote(newNote);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1 inline" />
                      {note ? 'Editar Obs.' : 'Observações'}
                    </button>
                  </div>
                  
                  {cartItems.length > 0 && (
                    <button 
                      className={`${preferences.theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                      onClick={clearCart}
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Totals and checkout */}
              <div className={`p-4 border-t ${
                preferences.theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-gray-100 border-gray-200'
              }`}>
                {/* Totals */}
                <div className="mb-4">
                  <div className={`flex justify-between text-sm mb-1 ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {discount.amount > 0 && (
                    <div className={`flex justify-between text-sm mb-1 ${preferences.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      <span>Desconto:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className={`flex justify-between text-lg font-bold mt-2 pt-2 border-t ${
                    preferences.theme === 'dark' 
                      ? 'text-white border-gray-700' 
                      : 'border-gray-200 text-gray-900'
                  }`}>
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
                
                {/* Checkout button */}
                <button
                  className={`w-full btn-primary py-3 flex items-center justify-center ${
                    cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => cartItems.length > 0 && setCurrentView('payment')}
                  disabled={cartItems.length === 0}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Ir para Pagamento
                </button>
              </div>
            </div>
            
            {/* Right Panel - Product Selection */}
            <div className={`md:w-2/5 flex flex-col ${preferences.theme === 'dark' ? 'bg-gray-900' : ''}`}>
              {/* Search and Categories */}
              <div className={`p-4 border-b ${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex mb-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="text"
                      className={`input pl-10 w-full ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : ''
                      }`}
                      placeholder="Buscar produto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className={`flex space-x-2 overflow-x-auto py-1 scrollbar-hide ${preferences.theme === 'dark' ? 'text-white' : ''}`}>
                  <button 
                    className={`px-3 py-1 rounded-full whitespace-nowrap ${
                      selectedCategory === null
                        ? 'bg-primary text-white'
                        : preferences.theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Populares
                  </button>
                  
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`px-3 py-1 rounded-full whitespace-nowrap ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : preferences.theme === 'dark' 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Products Grid */}
              <div className={`flex-1 overflow-y-auto p-4 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts().map(product => (
                    <button
                      key={product.id}
                      className={`p-4 rounded-lg border text-left ${
                        preferences.theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                          : 'bg-white border hover:shadow-sm'
                      } transition-shadow`}
                      onClick={() => addToCart(product)}
                    >
                      <h3 className={`font-medium mb-1 ${preferences.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                      <p className={`text-xs ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{product.sku}</p>
                      <div className={`mt-2 font-bold ${preferences.theme === 'dark' ? 'text-primary-light' : 'text-primary'}`}>{formatCurrency(product.price)}</div>
                    </button>
                  ))}
                </div>
                
                {filteredProducts().length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Search className={`h-16 w-16 mb-4 ${preferences.theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
                    <h3 className={`text-xl font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum produto encontrado</h3>
                    <p className={`text-center ${preferences.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Tente uma busca diferente ou selecione outra categoria
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
          
          {/* Add Customer Modal */}
          {showAddCustomer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg shadow-lg max-w-md w-full ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : ''}`}>
                  <h2 className={`text-xl font-semibold ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Selecionar Cliente</h2>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Buscar Cliente
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <input
                        type="text"
                        className={`input pl-10 w-full ${preferences.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        placeholder="Nome, documento, telefone..."
                      />
                    </div>
                  </div>
                  
                  <div className={`py-3 border-t border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
                    <div 
                      className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${
                        preferences.theme === 'dark' 
                          ? 'border-gray-700 hover:bg-gray-700' 
                          : 'border hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setCustomer({
                          id: '1',
                          name: 'Maria Silva',
                          document_type: 'cpf',
                          document_number: '123.456.789-00',
                          is_active: true,
                          created_at: '',
                          updated_at: ''
                        });
                        setShowAddCustomer(false);
                        toast.success("Cliente adicionado");
                      }}
                    >
                      <div className="flex justify-between">
                        <h3 className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>Maria Silva</h3>
                        <Tag className={`h-4 w-4 ${preferences.theme === 'dark' ? 'text-primary-light' : 'text-primary'}`} />
                      </div>
                      <p className={`text-sm ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CPF: 123.456.789-00</p>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${
                        preferences.theme === 'dark' 
                          ? 'border-gray-700 hover:bg-gray-700' 
                          : 'border hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setCustomer({
                          id: '2',
                          name: 'João Ferreira',
                          document_type: 'cpf',
                          document_number: '987.654.321-00',
                          is_active: true,
                          created_at: '',
                          updated_at: ''
                        });
                        setShowAddCustomer(false);
                        toast.success("Cliente adicionado");
                      }}
                    >
                      <div className="flex justify-between">
                        <h3 className={`font-medium ${preferences.theme === 'dark' ? 'text-white' : ''}`}>João Ferreira</h3>
                        <Tag className={`h-4 w-4 ${preferences.theme === 'dark' ? 'text-primary-light' : 'text-primary'}`} />
                      </div>
                      <p className={`text-sm ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CPF: 987.654.321-00</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button className={`w-full ${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                        : 'btn-outline'
                    }`}>
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Cadastrar Novo Cliente
                    </button>
                  </div>
                </div>
                
                <div className={`p-4 flex justify-end rounded-b-lg ${preferences.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <button 
                    className={`${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-700 text-white hover:bg-gray-600 px-4 py-2 rounded' 
                        : 'btn-outline'
                    }`}
                    onClick={() => setShowAddCustomer(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Discount Modal */}
          {showDiscountPanel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg shadow-lg max-w-md w-full ${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className={`p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : ''}`}>
                  <h2 className="text-xl font-semibold">Aplicar Desconto</h2>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tipo de Desconto
                    </label>
                    <div className="flex space-x-2">
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          discount.type === 'percentage'
                            ? 'bg-primary text-white'
                            : preferences.theme === 'dark' 
                              ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setDiscount({ ...discount, type: 'percentage' })}
                      >
                        Percentual (%)
                      </button>
                      
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          discount.type === 'value'
                            ? 'bg-primary text-white'
                            : preferences.theme === 'dark' 
                              ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setDiscount({ ...discount, type: 'value' })}
                      >
                        Valor (R$)
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {discount.type === 'percentage' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        <span>
                          {discount.type === 'percentage' ? '%' : 'R$'}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step={discount.type === 'percentage' ? '1' : '0.01'}
                        max={discount.type === 'percentage' ? '100' : subtotal}
                        className={`input pl-10 w-full ${
                          preferences.theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : ''
                        }`}
                        value={discount.amount}
                        onChange={(e) => setDiscount({
                          ...discount,
                          amount: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    {/* Quick discount buttons */}
                    {discount.type === 'percentage' && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {[5, 10, 15, 20].map(amount => (
                          <button 
                            key={amount}
                            className={`py-1 border rounded-lg text-sm text-center ${
                              preferences.theme === 'dark' 
                                ? 'border-gray-600 hover:bg-gray-700' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setDiscount({ ...discount, amount })}
                          >
                            {amount}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    preferences.theme === 'dark' 
                      ? 'bg-gray-700' 
                      : 'bg-gray-50'
                  }`}>
                    <div className={`flex justify-between text-sm mb-1 ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className={`flex justify-between text-sm mb-1 ${preferences.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      <span>Desconto:</span>
                      <span>
                        -{formatCurrency(
                          discount.type === 'percentage' 
                            ? subtotal * (discount.amount / 100) 
                            : Math.min(discount.amount, subtotal)
                        )}
                      </span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 mt-1 border-t ${
                      preferences.theme === 'dark' 
                        ? 'border-gray-600' 
                        : 'border-gray-200'
                    }`}>
                      <span>Total:</span>
                      <span>{formatCurrency(
                        subtotal - (
                          discount.type === 'percentage' 
                            ? subtotal * (discount.amount / 100) 
                            : Math.min(discount.amount, subtotal)
                        )
                      )}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 flex justify-between rounded-b-lg ${preferences.theme === 'dark' ? 'bg-gray-900 border-t border-gray-700' : 'bg-gray-50 border-t'}`}>
                  <button 
                    className={`${
                      preferences.theme === 'dark' 
                        ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600 py-2 px-4 rounded' 
                        : 'btn-outline'
                    }`}
                    onClick={() => setShowDiscountPanel(false)}
                  >
                    <Undo className="h-4 w-4 mr-2 inline" />
                    Cancelar
                  </button>
                  
                  <button 
                    className="btn-primary"
                    onClick={applyDiscount}
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    Aplicar Desconto
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Theme customizer modal */}
          {showThemeCustomizer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg max-w-2xl w-full`}>
                <div className={`flex items-center justify-between p-6 border-b ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-xl font-semibold">Personalizar Aparência</h3>
                  <button onClick={() => setShowThemeCustomizer(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
              </div>
            </div>
          )}
        </div>
      );
  }
};

export default ModernCheckout;