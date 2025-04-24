import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShoppingCart, Truck, User, Package, DollarSign, Search, Plus, Minus, Trash, Scan as Scanner, Receipt, CheckCircle, AlertTriangle, FileText, X, Clock, ChevronDown, QrCode, CreditCard, Banknote, Printer, Utensils } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import { useCashier } from '../../contexts/CashierContext';
import { useAuth } from '../../contexts/AuthContext';
import CashierOperations from '../../components/pos/CashierOperations';
import SaleReceipt from '../../components/pos/SaleReceipt';
import { Product, Sale, SaleItem, PaymentDetails, Customer, FiscalDocumentType } from '../../types/pos';
import { PaymentMethodType, PaymentTransaction } from '../../types/payment';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';
import PixPayment from '../../components/payment/PixPayment';
import CardPayment from '../../components/payment/CardPayment';
import CashPayment from '../../components/payment/CashPayment';
import PaymentReceipt from '../../components/payment/PaymentReceipt';
import FiscalDocumentSection from '../../components/pos/FiscalDocumentSection';
import FiscalDocumentButton from '../../components/FiscalDocumentButton';

/**
 * Página de PDV/Checkout integrada com sistema de pagamento
 * 
 * Permite:
 * - Adição de produtos ao carrinho
 * - Processamento de pagamentos (cartão, dinheiro, PIX, etc.)
 * - Emissão de documentos fiscais
 * - Impressão de comprovantes
 */
const Checkout: React.FC = () => {
  // Router navigation
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Cashier context
  const { currentSession, isSessionOpen } = useCashier();
  
  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState<{type: 'percentage'|'value', amount: number}>({ type: 'percentage', amount: 0 });
  const [total, setTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [note, setNote] = useState('');

  // Payment state
  const [currentStep, setCurrentStep] = useState<'cart' | 'payment' | 'receipt' | 'fiscal'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [paymentsMade, setPaymentsMade] = useState<{method: PaymentMethodType, transaction: PaymentTransaction}[]>([]);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // Sample product list - in a real app, this would come from an API or database
  const products = [
    { id: '1', sku: 'PF-001', barcode: '7891234567890', name: 'Pão Francês', price: 0.75, category: 'Pães', popular: true, stock_quantity: 120, tax_rate: 7, image_url: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '2', sku: 'SON-001', barcode: '7891234567891', name: 'Sonho', price: 4.50, category: 'Doces', popular: true, stock_quantity: 45, tax_rate: 7, image_url: 'https://images.pexels.com/photos/2955820/pexels-photo-2955820.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '3', sku: 'PQ-001', barcode: '7891234567892', name: 'Pão de Queijo', price: 3.50, category: 'Pães', popular: true, stock_quantity: 80, tax_rate: 7, image_url: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '4', sku: 'CAF-001', barcode: '7891234567893', name: 'Café', price: 3.00, category: 'Bebidas', stock_quantity: 150, tax_rate: 9, image_url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '5', sku: 'REF-001', barcode: '7891234567895', name: 'Refrigerante', price: 5.00, category: 'Bebidas', stock_quantity: 60, tax_rate: 9, image_url: 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '6', sku: 'AGU-001', barcode: '7891234567896', name: 'Água Mineral', price: 2.50, category: 'Bebidas', popular: true, stock_quantity: 85, tax_rate: 9, image_url: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '7', sku: 'CRO-001', barcode: '7891234567897', name: 'Croissant', price: 4.00, category: 'Pães', stock_quantity: 30, tax_rate: 7, image_url: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&dpr=1' },
    { id: '8', sku: 'CP-001', barcode: '7891234567898', name: 'Coxinha de Frango', price: 4.50, category: 'Salgados', popular: true, stock_quantity: 40, tax_rate: 7, image_url: 'https://images.pexels.com/photos/1855226/pexels-photo-1855226.jpeg?auto=compress&cs=tinysrgb&dpr=1' },
  ] as Product[];
  
  // Categories for filtering
  const categories = [...new Set(products.map(p => p.category))].sort();

  // Calculate cart totals when items change
  useEffect(() => {
    if (cartItems.length === 0) {
      setSubtotal(0);
      setTotal(0);
      setTax(0);
      setRemainingAmount(0);
      return;
    }

    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    let cartDiscount = 0;
    
    if (discount.type === 'percentage') {
      cartDiscount = cartSubtotal * (discount.amount / 100);
    } else {
      cartDiscount = Math.min(discount.amount, cartSubtotal);
    }
    
    const cartTax = cartItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const cartTotal = cartSubtotal - cartDiscount + cartTax;
    
    setSubtotal(cartSubtotal);
    setTotal(cartTotal);
    setTax(cartTax);
    
    // Calculate remaining amount for split payments
    const paidAmount = paymentsMade.reduce((sum, payment) => sum + payment.transaction.amount, 0);
    setRemainingAmount(Math.max(0, cartTotal - paidAmount));
  }, [cartItems, discount, paymentsMade]);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.product_id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = product.price * newQuantity;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal,
          tax_amount: newTotal * (product.tax_rate / 100)
        };
        
        return updatedItems;
      } else {
        // Add new item
        const total = product.price * quantity;
        const taxAmount = total * (product.tax_rate / 100);
        
        const newItem: SaleItem = {
          id: `temp-${Date.now()}-${product.id}`,
          sale_id: '',
          product_id: product.id,
          product_sku: product.sku,
          product_name: product.name,
          quantity,
          unit_price: product.price,
          discount: 0,
          total,
          tax_rate: product.tax_rate,
          tax_amount: taxAmount
        };
        
        return [...prevItems, newItem];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const product = products.find(p => p.id === item.product_id);
          if (!product) return item;
          
          const newTotal = product.price * newQuantity;
          return {
            ...item,
            quantity: newQuantity,
            total: newTotal,
            tax_amount: newTotal * (product.tax_rate / 100)
          };
        }
        return item;
      });
    });
  };

  // Clear cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      setCartItems([]);
      setDiscount({ type: 'percentage', amount: 0 });
      setNote('');
    }
  };

  // Handle barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    // Find product by barcode
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('Produto não encontrado');
    }
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter products based on search
  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      )
    : products.filter(p => p.popular);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Proceed to payment
  const proceedToPayment = () => {
    if (cartItems.length === 0) {
      alert('Adicione produtos ao carrinho antes de prosseguir');
      return;
    }
    
    if (!isSessionOpen) {
      if (window.confirm('É necessário abrir o caixa antes de prosseguir. Deseja abrir o caixa agora?')) {
        setShowCashierModal(true);
      }
      return;
    }
    
    setRemainingAmount(total);
    setCurrentStep('payment');
  };

  // Handle payment method selection
  const handlePaymentMethodSelected = (method: PaymentMethodType) => {
    setPaymentMethod(method);
  };

  // Handle payment success
  const handlePaymentSuccess = (transactionId: string, paymentTransaction: PaymentTransaction, change?: number) => {
    // Add to payments made
    setPaymentsMade(prev => [
      ...prev, 
      { 
        method: paymentTransaction.type,
        transaction: paymentTransaction
      }
    ]);
    
    // Store change amount if cash payment
    if (paymentTransaction.type === 'cash' && change !== undefined) {
      setChangeAmount(change);
    }
    
    // If payment is complete (remaining amount = 0), create sale
    if (paymentTransaction.amount >= remainingAmount) {
      completeSale();
    } else {
      // If there's remaining amount, go back to payment method selection
      setPaymentMethod(null);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setProcessingError(error);
    console.error('Payment error:', error);
    
    // Clear error after 5 seconds
    setTimeout(() => setProcessingError(null), 5000);
  };

  // Complete sale after successful payment
  const completeSale = async () => {
    if (cartItems.length === 0) {
      alert('Não é possível finalizar uma venda sem produtos');
      return;
    }
    
    if (paymentsMade.length === 0) {
      alert('Não é possível finalizar uma venda sem pagamento');
      return;
    }
    
    if (!currentSession || !isSessionOpen) {
      alert('O caixa está fechado. Por favor, abra o caixa antes de finalizar a venda.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // In a real app, this would be an API call to create the sale
      // For this example, we'll create a mock sale
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        operator_id: user?.id || 'unknown',
        terminal_id: 'checkout-terminal',
        cashier_session_id: currentSession.id,
        subtotal: subtotal,
        discount_amount: subtotal - total + tax,
        discount_type: discount.type,
        tax_amount: tax,
        total: total,
        status: 'completed',
        payment_details: paymentsMade.map(payment => {
          // Map payment transaction to payment details
          const details: PaymentDetails = {
            method: payment.method as any,
            amount: payment.transaction.amount
          };
          
          if (payment.method === 'cash' && payment.transaction.cashInfo) {
            details.received_amount = payment.transaction.cashInfo.amountPaid;
            details.change_amount = payment.transaction.cashInfo.changeAmount;
          }
          
          if ((payment.method === 'credit' || payment.method === 'debit') && payment.transaction.cardInfo) {
            details.integration = {
              transaction_id: payment.transaction.id,
              authorization_code: payment.transaction.cardInfo.authorizationCode,
              card_brand: payment.transaction.cardInfo.brand,
              card_last_digits: payment.transaction.cardInfo.lastDigits
            };
          }
          
          return details;
        }),
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        notes: note,
        customer: customer
      };
      
      // In a real app, we would save the sale to a database here
      console.log('Sale completed:', newSale);
      
      // Store the completed sale
      setCompletedSale(newSale);
      
      // Move to receipt step
      setCurrentStep('receipt');
    } catch (error) {
      console.error('Error completing sale:', error);
      setProcessingError(error instanceof Error ? error.message : 'Erro ao finalizar venda');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start a new sale
  const startNewSale = () => {
    setCartItems([]);
    setCustomer(null);
    setDiscount({ type: 'percentage', amount: 0 });
    setNote('');
    setPaymentsMade([]);
    setCompletedSale(null);
    setCurrentStep('cart');
    setPaymentMethod(null);
    setProcessingError(null);
    setChangeAmount(0);
    
    // Focus barcode input
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  // Render payment component based on selected method
  const renderPaymentComponent = () => {
    switch (paymentMethod) {
      case 'pix':
        return (
          <PixPayment
            amount={remainingAmount}
            onPaymentSuccess={(transactionId) => {
              // Create a simplified transaction object since we don't have access to the full transaction
              const pixTransaction: PaymentTransaction = {
                id: transactionId,
                type: 'pix',
                status: 'approved',
                amount: remainingAmount,
                currency: 'BRL',
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: new Date()
              };
              
              handlePaymentSuccess(transactionId, pixTransaction);
            }}
            onPaymentError={handlePaymentError}
            reference={`VENDA-${Date.now().toString().slice(-6)}`}
            customerName={customer?.name}
            customerEmail={customer?.email}
            customerDocument={customer?.document_number}
          />
        );
      case 'credit':
      case 'debit':
        return (
          <CardPayment
            amount={remainingAmount}
            onPaymentSuccess={(transactionId) => {
              // Create a simplified transaction object
              const cardTransaction: PaymentTransaction = {
                id: transactionId,
                type: paymentMethod,
                status: 'approved',
                amount: remainingAmount,
                currency: 'BRL',
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: new Date()
              };
              
              handlePaymentSuccess(transactionId, cardTransaction);
            }}
            onPaymentError={handlePaymentError}
            reference={`VENDA-${Date.now().toString().slice(-6)}`}
            customerName={customer?.name}
            customerEmail={customer?.email}
            customerDocument={customer?.document_number}
          />
        );
      case 'cash':
        return (
          <CashPayment
            amount={remainingAmount}
            onPaymentSuccess={(transactionId, change) => {
              // Create a simplified transaction object
              const cashTransaction: PaymentTransaction = {
                id: transactionId,
                type: 'cash',
                status: 'approved',
                amount: remainingAmount,
                currency: 'BRL',
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: new Date(),
                cashInfo: {
                  amountPaid: remainingAmount + (change || 0),
                  changeAmount: change || 0
                }
              };
              
              handlePaymentSuccess(transactionId, cashTransaction, change);
            }}
            onPaymentError={handlePaymentError}
            reference={`VENDA-${Date.now().toString().slice(-6)}`}
          />
        );
      case 'voucher':
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-center mb-4">
              <Utensils className="h-8 w-8 text-primary mr-2" />
              <h2 className="text-xl font-bold">Vale-Refeição/Alimentação</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vale
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 border-2 border-primary bg-primary/5 rounded-lg">
                    Refeição
                  </button>
                  <button className="py-3 border-2 border-gray-200 hover:border-primary/50 rounded-lg">
                    Alimentação
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-700">R$</span>
                  <input
                    type="text"
                    value={remainingAmount.toFixed(2)}
                    className="flex-1 border py-2 px-3 rounded-r-md"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 mr-2 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Aproxime o cartão no terminal POS ou insira manualmente o número do cartão.
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <button className="w-full py-3 bg-primary text-white rounded-lg">
                  <CreditCard className="h-5 w-5 mr-2 inline" />
                  Processar Pagamento
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p>Selecione um método de pagamento para continuar.</p>
            </div>
          </div>
        );
    }
  };

  // Render payment methods selection
  const renderPaymentMethodSelection = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">Forma de Pagamento</h3>
          <p className="text-gray-600">
            {paymentsMade.length === 0 
              ? `Valor total: ${formatCurrency(total)}`
              : `Valor restante: ${formatCurrency(remainingAmount)}`
            }
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button 
            className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
            onClick={() => handlePaymentMethodSelected('pix')}
          >
            <QrCode className="h-8 w-8 text-primary mb-2" />
            <span className="font-medium">PIX</span>
          </button>
          
          <button 
            className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
            onClick={() => handlePaymentMethodSelected('credit')}
          >
            <CreditCard className="h-8 w-8 text-blue-500 mb-2" />
            <span className="font-medium">Crédito</span>
          </button>
          
          <button 
            className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
            onClick={() => handlePaymentMethodSelected('debit')}
          >
            <CreditCard className="h-8 w-8 text-green-500 mb-2" />
            <span className="font-medium">Débito</span>
          </button>
          
          <button 
            className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
            onClick={() => handlePaymentMethodSelected('cash')}
          >
            <Banknote className="h-8 w-8 text-green-600 mb-2" />
            <span className="font-medium">Dinheiro</span>
          </button>
          
          <button 
            className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
            onClick={() => handlePaymentMethodSelected('voucher')}
          >
            <Utensils className="h-8 w-8 text-purple-500 mb-2" />
            <span className="font-medium">Vale</span>
          </button>
        </div>

        {/* Show payments made so far if there are any */}
        {paymentsMade.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-2">Pagamentos Realizados:</h4>
            <div className="space-y-2">
              {paymentsMade.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {payment.method === 'pix' && <QrCode className="h-5 w-5 text-primary mr-2" />}
                    {payment.method === 'credit' && <CreditCard className="h-5 w-5 text-blue-500 mr-2" />}
                    {payment.method === 'debit' && <CreditCard className="h-5 w-5 text-green-500 mr-2" />}
                    {payment.method === 'cash' && <Banknote className="h-5 w-5 text-green-600 mr-2" />}
                    {payment.method === 'voucher' && <Utensils className="h-5 w-5 text-purple-500 mr-2" />}
                    <span>
                      {payment.method === 'pix' ? 'PIX' :
                       payment.method === 'credit' ? 'Cartão de Crédito' :
                       payment.method === 'debit' ? 'Cartão de Débito' :
                       payment.method === 'cash' ? 'Dinheiro' :
                       payment.method === 'voucher' ? 'Vale' : 'Outro'}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.transaction.amount)}</span>
                </div>
              ))}
              
              {/* Total payment */}
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg font-medium">
                <span>Total Pago:</span>
                <span>{formatCurrency(paymentsMade.reduce((sum, p) => sum + p.transaction.amount, 0))}</span>
              </div>
              
              {/* Remaining amount */}
              {remainingAmount > 0 && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg text-yellow-700">
                  <span>Falta:</span>
                  <span>{formatCurrency(remainingAmount)}</span>
                </div>
              )}
            </div>
            
            {/* Cancel payment button */}
            <div className="mt-4">
              <button 
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja cancelar os pagamentos?')) {
                    setPaymentsMade([]);
                    setRemainingAmount(total);
                  }
                }}
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar Pagamentos
              </button>
            </div>
          </div>
        )}
        
        {/* Payment processing error */}
        {processingError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Erro no Pagamento</h4>
                <p className="text-sm text-red-700">{processingError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-6 flex justify-between">
          <button 
            className="py-2 px-4 border rounded-lg hover:bg-gray-50"
            onClick={() => setCurrentStep('cart')}
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Voltar para Carrinho
          </button>
          
          {remainingAmount <= 0 && (
            <button 
              className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={completeSale}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 inline" />
                  Finalizar Venda
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render selected payment method form
  const renderPaymentForm = () => {
    return (
      <div className="mb-6">
        {/* Payment method selector header */}
        <div className="mb-4 flex items-center">
          <button 
            className="text-primary hover:text-primary-dark mr-3"
            onClick={() => setPaymentMethod(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-semibold">
            {paymentMethod === 'pix' ? 'Pagamento via PIX' :
             paymentMethod === 'credit' ? 'Pagamento com Cartão de Crédito' :
             paymentMethod === 'debit' ? 'Pagamento com Cartão de Débito' :
             paymentMethod === 'cash' ? 'Pagamento em Dinheiro' :
             paymentMethod === 'voucher' ? 'Pagamento com Vale' : 'Pagamento'}
          </h3>
        </div>
        
        {/* Payment method component */}
        {renderPaymentComponent()}
      </div>
    );
  };

  // Render receipt after successful payment
  const renderReceipt = () => {
    if (!completedSale) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venda Concluída!</h2>
          <div className="text-lg text-gray-600">
            {formatCurrency(completedSale.total)} • {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
          </div>
          
          {/* Change amount if payment was in cash */}
          {changeAmount > 0 && (
            <div className="mt-3">
              <div className="inline-block px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                Troco: {formatCurrency(changeAmount)}
              </div>
            </div>
          )}
        </div>
        
        {/* Payment details */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Detalhes do Pagamento</h3>
          <div className="space-y-2">
            {completedSale.payment_details.map((payment, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center">
                  {payment.method === 'pix' && <QrCode className="h-5 w-5 text-primary mr-2" />}
                  {payment.method === 'credit' && <CreditCard className="h-5 w-5 text-blue-500 mr-2" />}
                  {payment.method === 'debit' && <CreditCard className="h-5 w-5 text-green-500 mr-2" />}
                  {payment.method === 'cash' && <Banknote className="h-5 w-5 text-green-600 mr-2" />}
                  {payment.method === 'voucher_food' && <Utensils className="h-5 w-5 text-purple-500 mr-2" />}
                  <span>
                    {payment.method === 'pix' ? 'PIX' :
                     payment.method === 'credit' ? 'Cartão de Crédito' :
                     payment.method === 'debit' ? 'Cartão de Débito' :
                     payment.method === 'cash' ? 'Dinheiro' :
                     payment.method === 'voucher_food' ? 'Vale Alimentação' : 
                     payment.method === 'voucher_meal' ? 'Vale Refeição' : 'Outro'}
                  </span>
                </div>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <ReactToPrint
            trigger={() => (
              <button className="btn-outline py-3 flex items-center justify-center flex-1">
                <Printer className="h-5 w-5 mr-2" />
                Imprimir Comprovante
              </button>
            )}
            content={() => receiptRef.current}
          />
          
          <button
            className="btn-primary py-3 flex-1 flex items-center justify-center"
            onClick={() => setCurrentStep('fiscal')}
          >
            <FileText className="h-5 w-5 mr-2" />
            Emitir Nota Fiscal
          </button>
        </div>
        
        <div className="mt-4">
          <button
            className="py-2 w-full text-primary hover:text-primary-dark"
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
            companyName="Casa dos Pães"
            companyDocument="12.345.678/0001-90"
            companyAddress="Av. Paulista, 1234 - São Paulo/SP"
            companyPhone="(11) 5555-1234"
          />
        </div>
      </div>
    );
  };

  // Render fiscal document step
  const renderFiscalDocument = () => {
    if (!completedSale) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-semibold">Emissão de Documento Fiscal</h2>
        </div>

        <FiscalDocumentSection 
          sale={completedSale}
          items={cartItems}
        />

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            className="btn-primary py-3 px-6"
            onClick={startNewSale}
          >
            Concluir e Iniciar Nova Venda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">PDV / Checkout</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {isSessionOpen ? (
              <button 
                className="flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full"
                onClick={() => setShowCashierModal(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Caixa Aberto
              </button>
            ) : (
              <button 
                className="flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full"
                onClick={() => setShowCashierModal(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Caixa Fechado
              </button>
            )}
            
            <button 
              className="relative flex items-center p-2 rounded-full text-gray-600 hover:bg-gray-100"
              onClick={() => alert('Cliente não implementado')}
            >
              <User className="h-5 w-5" />
            </button>
            
            <button
              className="relative flex items-center p-2 rounded-full text-gray-600 hover:bg-gray-100"
              onClick={() => alert('Mostrar últimas vendas')}
            >
              <Clock className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left side (Cart and Products) - Show in step cart */}
        {currentStep === 'cart' && (
          <>
            {/* Cart Panel (Left Side) */}
            <div className="md:col-span-8 bg-white rounded-lg shadow-sm overflow-hidden border">
              {/* Search and scan bar */}
              <div className="p-4 border-b">
                <form onSubmit={handleBarcodeSubmit} className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Scanner className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      className="input pl-10 w-full"
                      placeholder="Scanner de código de barras"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Buscar
                  </button>
                </form>
              </div>
              
              {/* Cart items */}
              <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '300px' }}>
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                    <ShoppingCart className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-medium mb-2">Carrinho Vazio</h3>
                    <p className="text-center">Utilize o scanner ou selecione os produtos para adicionar ao carrinho</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name}</h4>
                          <div className="flex text-sm text-gray-500">
                            <span>{formatCurrency(item.unit_price)}</span>
                            <span className="mx-2">•</span>
                            <span>SKU: {item.product_sku}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Quantity controls */}
                          <div className="flex items-center space-x-2">
                            <button 
                              className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center">{item.quantity}</span>
                            <button 
                              className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          
                          {/* Price and remove */}
                          <div className="flex items-center">
                            <span className="font-medium w-20 text-right">{formatCurrency(item.total)}</span>
                            <button 
                              className="ml-3 text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Bottom controls */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  {/* Customer and Notes */}
                  <div className="flex space-x-3">
                    <button 
                      className="btn-outline py-2 text-sm"
                      onClick={() => alert('Seleção de cliente não implementada')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {customer ? 'Alterar Cliente' : 'Adicionar Cliente'}
                    </button>
                    <button 
                      className="btn-outline py-2 text-sm"
                      onClick={() => {
                        const newNote = prompt('Observações:', note);
                        if (newNote !== null) {
                          setNote(newNote);
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {note ? 'Editar Obs.' : 'Adicionar Obs.'}
                    </button>
                  </div>
                  
                  {/* Clear cart */}
                  {cartItems.length > 0 && (
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={clearCart}
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel (Totals and Product Selection) */}
            <div className="md:col-span-4 space-y-6">
              {/* Totals card */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold mb-4">Resumo da Venda</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Desconto:</span>
                      <select
                        value={discount.type}
                        onChange={(e) => setDiscount({ ...discount, type: e.target.value as 'percentage'|'value' })}
                        className="text-xs border rounded py-0 px-1"
                      >
                        <option value="percentage">%</option>
                        <option value="value">R$</option>
                      </select>
                      <input 
                        type="number" 
                        min="0" 
                        value={discount.amount}
                        onChange={(e) => setDiscount({ ...discount, amount: Number(e.target.value) })}
                        className="w-16 ml-1 text-xs border rounded py-0 px-1"
                      />
                    </div>
                    <span>{formatCurrency(subtotal - total + tax)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impostos:</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t font-bold">
                    <span>Total:</span>
                    <span className="text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
                
                <button 
                  className="mt-4 w-full btn-primary py-3"
                  onClick={proceedToPayment}
                  disabled={cartItems.length === 0}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Ir para Pagamento
                </button>
              </div>
              
              {/* Product search */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Produtos</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="input pl-10 w-full"
                      placeholder="Buscar produto..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
                
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
                      onClick={() => setSearchQuery(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                {/* Product list */}
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      className="p-2 border rounded text-left hover:border-primary hover:bg-gray-50"
                      onClick={() => addToCart(product)}
                    >
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate">{product.sku}</div>
                      <div className="font-bold text-primary">{formatCurrency(product.price)}</div>
                    </button>
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="col-span-2 p-4 text-center text-gray-500">
                      {searchQuery 
                        ? 'Nenhum produto encontrado'
                        : 'Produtos populares aparecerão aqui'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment Step */}
        {currentStep === 'payment' && (
          <div className="md:col-span-12">
            {paymentMethod ? renderPaymentForm() : renderPaymentMethodSelection()}
          </div>
        )}

        {/* Receipt Step */}
        {currentStep === 'receipt' && (
          <div className="md:col-span-12">
            {renderReceipt()}
          </div>
        )}

        {/* Fiscal Document Step */}
        {currentStep === 'fiscal' && (
          <div className="md:col-span-12">
            {renderFiscalDocument()}
          </div>
        )}
      </main>

      {/* Cashier Modal */}
      {showCashierModal && (
        <CashierOperations onClose={() => setShowCashierModal(false)} />
      )}
    </div>
  );
};

export default Checkout;