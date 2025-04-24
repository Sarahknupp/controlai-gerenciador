import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Scan, ShoppingCart, Search, Plus, Minus, Trash, User, Tag, ChevronLeft, CreditCard, Banknote, QrCode, FileText, Receipt, DollarSign, Percent, Edit, Check, X, AlertTriangle, Clock, Printer, Settings, Moon, Sun, Table, Store, KeyRound, LayoutGrid, History, RefreshCw, PenTool, DivideIcon as LucideIcon, LogOut, Palette, HelpCircle, Keyboard, CircleDollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCashier } from '../../contexts/CashierContext';
import { useAuth } from '../../contexts/AuthContext';
import ReactToPrint from 'react-to-print';
import SaleReceipt from '../../components/pos/SaleReceipt';
import { Product, Sale, SaleItem, Customer, PaymentDetails } from '../../types/pos';
import FiscalDocumentButton from '../../components/FiscalDocumentButton';
import CashierOperations from '../../components/pos/CashierOperations';
import { toast } from 'react-toastify';

// Define the table/order type
interface Table {
  id: string;
  number: number;
  status: 'free' | 'occupied' | 'bill-requested';
  startTime?: Date;
  customer?: string;
  orders: SaleItem[];
  notes?: string;
}

// Define operation modes
type OperationMode = 'counter' | 'tables';

// Define theme modes
type ThemeMode = 'light' | 'dark' | 'custom';

// Define action history entry
interface ActionHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  user: string;
  undoable: boolean;
  undoFunction?: () => void;
}

/**
 * Modern PDV with enhanced features including dark mode, responsive design,
 * keyboard shortcuts, and multiple operation modes
 */
const PDVModern: React.FC = () => {
  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  // Auth and cashier contexts
  const { user } = useAuth();
  const { currentSession, isSessionOpen } = useCashier();
  
  // Theme and UI settings
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6'); // Default blue
  const [fontSize, setFontSize] = useState('normal');
  const [contrast, setContrast] = useState('normal');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showShortcutPanel, setShowShortcutPanel] = useState(false);
  
  // Operation mode
  const [operationMode, setOperationMode] = useState<OperationMode>('counter');
  const [tables, setTables] = useState<Table[]>([
    { id: '1', number: 1, status: 'free', orders: [] },
    { id: '2', number: 2, status: 'occupied', startTime: new Date(), customer: 'Mesa 2', orders: [] },
    { id: '3', number: 3, status: 'free', orders: [] },
    { id: '4', number: 4, status: 'free', orders: [] },
    { id: '5', number: 5, status: 'bill-requested', startTime: new Date(), customer: 'Mesa 5', orders: [] },
    { id: '6', number: 6, status: 'free', orders: [] },
    { id: '7', number: 7, status: 'free', orders: [] },
    { id: '8', number: 8, status: 'free', orders: [] },
  ]);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState<{type: 'percentage'|'value', amount: number}>({ type: 'percentage', amount: 0 });
  
  // UI state
  const [currentView, setCurrentView] = useState<'cart' | 'payment' | 'receipt' | 'fiscal'>('cart');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'pix' | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  
  // Action history
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<{sale: Sale, items: SaleItem[]} | null>(null);
  
  // Track selected item
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Clear cart with confirmation - Moved up before it's used in shortcuts
  const clearCartWithConfirmation = useCallback(() => {
    if (cartItems.length === 0 && (!activeTable || activeTable.orders.length === 0)) {
      toast.info("O carrinho já está vazio");
      return;
    }
    
    if (window.confirm('Tem certeza que deseja cancelar esta venda?')) {
      clearCart();
    }
  }, [cartItems, activeTable]);

  // Keyboard shortcuts
  const [shortcuts] = useState({
    F2: { key: 'F2', description: 'Pesquisar produtos', action: () => searchInputRef.current?.focus() },
    F3: { key: 'F3', description: 'Cancelar item selecionado', action: removeSelectedItem },
    F4: { key: 'F4', description: 'Cancelar venda atual', action: clearCartWithConfirmation },
    F5: { key: 'F5', description: 'Finalizar venda', action: () => cartItems.length > 0 && setCurrentView('payment') },
    F6: { key: 'F6', description: 'Abrir gaveta', action: openCashDrawer },
    F7: { key: 'F7', description: 'Reimprimir último cupom', action: reprintLastReceipt },
    F8: { key: 'F8', description: 'Alternar modo PDV', action: toggleOperationMode },
    F9: { key: 'F9', description: 'Configurações', action: () => setShowSettingsPanel(true) },
    F10: { key: 'F10', description: 'Visualizar histórico', action: () => setShowHistory(true) },
    F12: { key: 'F12', description: 'Operações de caixa', action: () => setShowCashierModal(true) }
  });

  // Sample products data (in a real app, this would come from a database)
  const products: Product[] = [
    { id: '1', sku: 'PF001', name: 'Pão Francês', price: 0.75, category_id: 'breads', unit: 'un', barcode: '7891234500001', stock_quantity: 150, tax_rate: 0, cost_price: 0.3, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '2', sku: 'PQ001', name: 'Pão de Queijo', price: 3.50, category_id: 'breads', unit: 'un', barcode: '7891234500002', stock_quantity: 80, tax_rate: 0, cost_price: 1.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '3', sku: 'CAF001', name: 'Café', price: 3.00, category_id: 'drinks', unit: 'un', barcode: '7891234500003', stock_quantity: 120, tax_rate: 0, cost_price: 1.2, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '09011110', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '4', sku: 'SUCO001', name: 'Suco Natural', price: 6.00, category_id: 'drinks', unit: 'un', barcode: '7891234500004', stock_quantity: 50, tax_rate: 0, cost_price: 2.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '20091900', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '5', sku: 'BOLO001', name: 'Bolo de Chocolate', price: 5.00, category_id: 'desserts', unit: 'un', barcode: '7891234500005', stock_quantity: 25, tax_rate: 0, cost_price: 2, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '19059090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '6', sku: 'SAND001', name: 'Sanduíche Natural', price: 8.50, category_id: 'snacks', unit: 'un', barcode: '7891234500006', stock_quantity: 30, tax_rate: 0, cost_price: 3.5, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '16023200', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '7', sku: 'REFRI001', name: 'Refrigerante Lata', price: 4.50, category_id: 'drinks', unit: 'un', barcode: '7891234500007', stock_quantity: 80, tax_rate: 0, cost_price: 2.2, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '22021000', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
    { id: '8', sku: 'PIZZA001', name: 'Pizza Fatia', price: 6.50, category_id: 'snacks', unit: 'un', barcode: '7891234500008', stock_quantity: 15, tax_rate: 0, cost_price: 3.0, is_active: true, is_service: false, allow_fractions: false, fiscal_data: { ncm: '21069090', cfop: '5102', origin: '0', icms_rate: 0, pis_rate: 0, cofins_rate: 0, ipi_rate: 0 }, created_at: '', updated_at: '' },
  ];
  
  // Categories
  const categories = [
    { id: 'breads', name: 'Pães', icon: 'Bread' },
    { id: 'drinks', name: 'Bebidas', icon: 'Coffee' },
    { id: 'desserts', name: 'Doces', icon: 'Cake' },
    { id: 'snacks', name: 'Lanches', icon: 'Sandwich' }
  ];
  
  // Cart calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discount.type === 'percentage' 
    ? subtotal * (discount.amount / 100) 
    : Math.min(discount.amount, subtotal);
  const total = subtotal - discountAmount;
  
  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('pdv-theme') as ThemeMode || 'light';
    setThemeMode(savedTheme);
    
    const savedColor = localStorage.getItem('pdv-primary-color') || '#3b82f6';
    setPrimaryColor(savedColor);
    
    const savedFontSize = localStorage.getItem('pdv-font-size') || 'normal';
    setFontSize(savedFontSize);
    
    const savedContrast = localStorage.getItem('pdv-contrast') || 'normal';
    setContrast(savedContrast);
    
    // Load recent products
    const recentProductIds = ['1', '2', '6']; // In a real app, get these from analytics or user history
    setRecentProducts(products.filter(p => recentProductIds.includes(p.id)));
  }, []);
  
  // Apply theme when it changes
  useEffect(() => {
    if (!mainContainerRef.current) return;
    
    // Add theme class
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      mainContainerRef.current.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark');
      mainContainerRef.current.classList.remove('dark-theme');
    }
    
    // Save to localStorage
    localStorage.setItem('pdv-theme', themeMode);
  }, [themeMode]);
  
  // Apply custom colors and settings
  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('pdv-primary-color', primaryColor);
    localStorage.setItem('pdv-font-size', fontSize);
    localStorage.setItem('pdv-contrast', contrast);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--primary-hsl', hexToHSL(primaryColor));
    
    // Set font size
    document.body.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'small') document.body.classList.add('text-sm');
    if (fontSize === 'large') document.body.classList.add('text-lg');
    
    // Set contrast
    document.body.classList.remove('contrast-high');
    if (contrast === 'high') document.body.classList.add('contrast-high');
  }, [primaryColor, fontSize, contrast]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focused on input elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      const key = e.key;
      
      // Handle function keys
      if (key.startsWith('F') && shortcuts[key as keyof typeof shortcuts]) {
        e.preventDefault();
        shortcuts[key as keyof typeof shortcuts].action();
      }
      
      // Other keyboard shortcuts
      switch (key) {
        case 'Escape':
          if (currentView !== 'cart') {
            e.preventDefault();
            setCurrentView('cart');
          } else if (showSettingsPanel || showDiscountPanel || showCustomerModal || showHistory || showShortcutPanel || showCashierModal) {
            e.preventDefault();
            setShowSettingsPanel(false);
            setShowDiscountPanel(false);
            setShowCustomerModal(false);
            setShowHistory(false);
            setShowShortcutPanel(false);
            setShowCashierModal(false);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown as any);
    return () => document.removeEventListener('keydown', handleKeyDown as any);
  }, [currentView, shortcuts, showSettingsPanel, showDiscountPanel, showCustomerModal, showHistory, showShortcutPanel, showCashierModal]);
  
  // Focus barcode input on mount and when returning to cart view
  useEffect(() => {
    if (currentView === 'cart' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [currentView]);
  
  // Initial loading of data
  useEffect(() => {
    // Load recent products
    const recentProductIds = ['1', '2', '6']; // In a real app, get these from analytics
    setRecentProducts(products.filter(p => recentProductIds.includes(p.id)));
  }, []);
  
  // Helper to convert hex to HSL for CSS variables
  const hexToHSL = (hex: string): string => {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find max and min values to determine hue
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }
    
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  
  // Log actions to history
  const logAction = useCallback((action: string, details: string, undoable: boolean = false, undoFunction?: () => void) => {
    const newEntry: ActionHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      details,
      user: user?.email || 'sistema',
      undoable,
      undoFunction
    };
    
    setActionHistory(prev => [newEntry, ...prev.slice(0, 99)]); // Keep last 100 actions
  }, [user?.email]);
  
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
      
      logAction('add_product', `Produto "${product.name}" adicionado via código de barras`);
    } else {
      toast.error("Produto não encontrado");
    }
  };
  
  // Filter products by search or category
  const filteredProducts = useCallback(() => {
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
  }, [searchQuery, selectedCategory, recentProducts, products]);
  
  // Add product to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    // If in tables mode and a table is active, add to table's orders
    if (operationMode === 'tables' && activeTable) {
      setTables(prev => {
        return prev.map(table => {
          if (table.id === activeTable.id) {
            // Check if product already in table's orders
            const existingItemIndex = table.orders.findIndex(item => item.product_id === product.id);
            
            if (existingItemIndex >= 0) {
              // Update existing item
              const updatedOrders = [...table.orders];
              const existingItem = updatedOrders[existingItemIndex];
              const newQuantity = existingItem.quantity + quantity;
              const newTotal = product.price * newQuantity;
              
              updatedOrders[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                total: newTotal
              };
              
              return {
                ...table,
                orders: updatedOrders
              };
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
              
              return {
                ...table,
                orders: [...table.orders, newItem]
              };
            }
          }
          return table;
        });
      });
      
      logAction('add_product_to_table', `Produto "${product.name}" adicionado à mesa ${activeTable.number}`);
      return;
    }
    
    // Regular counter mode
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
        
        logAction('update_product_quantity', `Quantidade de "${product.name}" atualizada para ${newQuantity}`, true, 
          () => updateQuantity(existingItem.id, existingItem.quantity)
        );
        
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
        
        logAction('add_product', `Produto "${product.name}" adicionado ao carrinho`, true,
          () => removeFromCart(newItem.id)
        );
        
        return [...prev, newItem];
      }
    });
  }, [operationMode, activeTable, logAction]);
  
  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    // If in tables mode and a table is active, remove from table's orders
    if (operationMode === 'tables' && activeTable) {
      const itemToRemove = activeTable.orders.find(item => item.id === itemId);
      
      setTables(prev => {
        return prev.map(table => {
          if (table.id === activeTable.id) {
            return {
              ...table,
              orders: table.orders.filter(item => item.id !== itemId)
            };
          }
          return table;
        });
      });
      
      if (itemToRemove) {
        logAction('remove_product_from_table', `Produto "${itemToRemove.product_name}" removido da mesa ${activeTable.number}`, true,
          () => {
            if (itemToRemove) {
              setTables(prev => {
                return prev.map(table => {
                  if (table.id === activeTable.id) {
                    return {
                      ...table,
                      orders: [...table.orders, itemToRemove]
                    };
                  }
                  return table;
                });
              });
            }
          }
        );
      }
      
      return;
    }
    
    // Regular counter mode
    const itemToRemove = cartItems.find(item => item.id === itemId);
    
    setCartItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      if (itemId === selectedItemId) {
        setSelectedItemId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    
    if (itemToRemove) {
      logAction('remove_product', `Produto "${itemToRemove.product_name}" removido do carrinho`, true,
        () => {
          if (itemToRemove) {
            setCartItems(prev => [...prev, itemToRemove]);
          }
        }
      );
    }
  }, [operationMode, activeTable, cartItems, selectedItemId, logAction]);
  
  // Remove selected item
  function removeSelectedItem() {
    if (selectedItemId) {
      if (window.confirm('Deseja remover o item selecionado?')) {
        removeFromCart(selectedItemId);
      }
    } else {
      toast.info("Selecione um item para remover");
    }
  }
  
  // Update item quantity
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    // If in tables mode and a table is active, update table's orders
    if (operationMode === 'tables' && activeTable) {
      const item = activeTable.orders.find(item => item.id === itemId);
      const oldQuantity = item?.quantity || 0;
      
      setTables(prev => {
        return prev.map(table => {
          if (table.id === activeTable.id) {
            return {
              ...table,
              orders: table.orders.map(item => {
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
              })
            };
          }
          return table;
        });
      });
      
      if (item) {
        logAction('update_quantity_table', `Quantidade de "${item.product_name}" na mesa ${activeTable.number} atualizada de ${oldQuantity} para ${newQuantity}`, true,
          () => {
            setTables(prev => {
              return prev.map(table => {
                if (table.id === activeTable.id) {
                  return {
                    ...table,
                    orders: table.orders.map(i => {
                      if (i.id === itemId) {
                        return {
                          ...i,
                          quantity: oldQuantity,
                          total: i.unit_price * oldQuantity
                        };
                      }
                      return i;
                    })
                  };
                }
                return table;
              });
            });
          }
        );
      }
      
      return;
    }
    
    // Regular counter mode
    const item = cartItems.find(item => item.id === itemId);
    const oldQuantity = item?.quantity || 0;
    
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
    
    if (item) {
      logAction('update_quantity', `Quantidade de "${item.product_name}" atualizada de ${oldQuantity} para ${newQuantity}`, true,
        () => {
          setCartItems(prev => {
            return prev.map(i => {
              if (i.id === itemId) {
                return {
                  ...i,
                  quantity: oldQuantity,
                  total: i.unit_price * oldQuantity
                };
              }
              return i;
            });
          });
        }
      );
    }
  }, [operationMode, activeTable, cartItems, products, logAction, removeFromCart]);
  
  // Handle discount application
  const applyDiscount = useCallback(() => {
    setShowDiscountPanel(false);
    
    if (discount.amount > 0) {
      const oldDiscount = { ...discount };
      logAction('apply_discount', `Aplicado desconto de ${
        discount.type === 'percentage' 
          ? `${discount.amount}%` 
          : formatCurrency(discount.amount)
      }`, true, () => {
        setDiscount(oldDiscount);
      });
    }
  }, [discount, logAction]);
  
  // Clear cart
  const clearCart = useCallback(() => {
    // If in tables mode and a table is active, clear table's orders
    if (operationMode === 'tables' && activeTable) {
      const oldOrders = [...activeTable.orders];
      
      setTables(prev => {
        return prev.map(table => {
          if (table.id === activeTable.id) {
            return {
              ...table,
              orders: []
            };
          }
          return table;
        });
      });
      
      logAction('clear_table_orders', `Todos os produtos foram removidos da mesa ${activeTable.number}`, true,
        () => {
          setTables(prev => {
            return prev.map(table => {
              if (table.id === activeTable.id) {
                return {
                  ...table,
                  orders: oldOrders
                };
              }
              return table;
            });
          });
        }
      );
      
      return;
    }
    
    // Regular counter mode
    const oldCartItems = [...cartItems];
    const oldDiscount = { ...discount };
    const oldCustomer = customer;
    const oldNote = note;
    
    setCartItems([]);
    setDiscount({ type: 'percentage', amount: 0 });
    setCustomer(null);
    setNote('');
    setSelectedItemId(null);
    
    logAction('clear_cart', 'Carrinho limpo', true, 
      () => {
        setCartItems(oldCartItems);
        setDiscount(oldDiscount);
        setCustomer(oldCustomer);
        setNote(oldNote);
      }
    );
  }, [operationMode, activeTable, cartItems, discount, customer, note, logAction]);
  
  // Process payment
  const processPayment = useCallback(() => {
    const itemsToProcess = operationMode === 'tables' && activeTable 
      ? activeTable.orders 
      : cartItems;
    
    if (itemsToProcess.length === 0) return;
    
    if (!isSessionOpen) {
      toast.error("É necessário abrir o caixa primeiro!");
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
      setLastPrintedReceipt({ sale: newSale, items: itemsToProcess });
      
      // If in tables mode and a table is active, update table status
      if (operationMode === 'tables' && activeTable) {
        setTables(prev => {
          return prev.map(table => {
            if (table.id === activeTable.id) {
              return {
                ...table,
                status: 'free',
                orders: [],
                customer: undefined,
                startTime: undefined,
              };
            }
            return table;
          });
        });
        
        logAction('table_checkout', `Mesa ${activeTable.number} foi fechada`, false);
        
        // Return to tables view after checkout
        setActiveTable(null);
      } else {
        logAction('checkout', `Venda finalizada no valor de ${formatCurrency(total)}`, false);
      }
      
      setCurrentView('receipt');
      setIsProcessingPayment(false);
    }, 2000); // Simulate processing delay
  }, [operationMode, activeTable, cartItems, isSessionOpen, paymentMethod, total, subtotal, discountAmount, discount, note, customer, currentSession?.id, user?.id, logAction]);
  
  // Start new sale
  const startNewSale = useCallback(() => {
    setCartItems([]);
    setDiscount({ type: 'percentage', amount: 0 });
    setCustomer(null);
    setNote('');
    setCurrentView('cart');
    setPaymentMethod(null);
    setCompletedSale(null);
    
    // If in tables mode, go back to table selection
    if (operationMode === 'tables') {
      setActiveTable(null);
    }
    
    // Refocus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    
    logAction('new_sale', 'Nova venda iniciada', false);
  }, [operationMode, logAction]);
  
  // Toggle operation mode
  function toggleOperationMode() {
    if (cartItems.length > 0 && operationMode === 'counter') {
      if (window.confirm('Mudar o modo de operação cancelará a venda atual. Deseja continuar?')) {
        clearCart();
        setOperationMode(prev => prev === 'counter' ? 'tables' : 'counter');
        logAction('change_mode', `Modo alterado para ${operationMode === 'counter' ? 'Mesas' : 'Balcão'}`, false);
      }
    } else {
      setOperationMode(prev => prev === 'counter' ? 'tables' : 'counter');
      logAction('change_mode', `Modo alterado para ${operationMode === 'counter' ? 'Mesas' : 'Balcão'}`, false);
    }
  }
  
  // Open cash drawer
  function openCashDrawer() {
    if (!isSessionOpen) {
      toast.error("É necessário abrir o caixa primeiro!");
      return;
    }
    
    toast.info("Abrindo gaveta de dinheiro...");
    
    // In a real implementation, this would call a hardware API
    // For this example, we'll just log it
    logAction('open_drawer', 'Gaveta de dinheiro aberta', false);
  }
  
  // Reprint last receipt
  function reprintLastReceipt() {
    if (!lastPrintedReceipt) {
      toast.error("Não há comprovante para reimprimir");
      return;
    }
    
    if (receiptRef.current) {
      try {
        // This would trigger the print dialog in a real implementation
        // Here we're just logging and showing a toast
        toast.success("Reimprimindo comprovante...");
        logAction('reprint', 'Comprovante reimpresso', false);
      } catch (error) {
        toast.error("Erro ao reimprimir comprovante");
      }
    }
  }
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Select an item in the cart
  const selectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };
  
  // Get active cart items based on operation mode
  const getActiveCartItems = () => {
    if (operationMode === 'tables' && activeTable) {
      return activeTable.orders;
    }
    return cartItems;
  };

  // Customer display component
  const CustomerDisplay = () => {
    if (!customer) return null;
    
    return (
      <div className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full max-w-fit dark:bg-blue-900 dark:text-blue-200">
        <User className="h-3 w-3 mr-1" /> 
        <span className="truncate max-w-[120px]">{customer.name}</span>
        <button className="ml-1 text-blue-700 dark:text-blue-200" onClick={() => setCustomer(null)}>
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };
  
  // Theme and UI elements
  
  // Generate theme CSS
  const getThemeClasses = useCallback(() => {
    const baseClasses = "min-h-screen transition-colors";
    
    if (themeMode === 'dark') {
      return `${baseClasses} bg-gray-900 text-white`;
    }
    
    return `${baseClasses} bg-gray-50 text-gray-900`;
  }, [themeMode]);
  
  // Generate background classes based on theme
  const getBgClasses = useCallback((element: 'card' | 'header' | 'sidebar' | 'button' | 'input') => {
    if (themeMode === 'dark') {
      switch (element) {
        case 'card': return 'bg-gray-800 border-gray-700';
        case 'header': return 'bg-gray-800 border-gray-700 shadow-lg';
        case 'sidebar': return 'bg-gray-800 border-gray-700';
        case 'button': return 'bg-gray-700 hover:bg-gray-600 text-white';
        case 'input': return 'bg-gray-700 border-gray-600 text-white';
      }
    }
    
    switch (element) {
      case 'card': return 'bg-white border-gray-200';
      case 'header': return 'bg-white border-gray-200 shadow-sm';
      case 'sidebar': return 'bg-white border-gray-200';
      case 'button': return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
      case 'input': return 'bg-white border-gray-300 text-gray-900';
    }
  }, [themeMode]);
  
  // Keyboard shortcuts bar
  const ShortcutsBar = () => (
    <div className={`flex overflow-x-auto py-2 px-4 shadow-inner border-t ${getBgClasses('sidebar')}`}>
      <div className="flex space-x-2 mx-auto">
        {Object.entries(shortcuts).map(([key, shortcut]) => (
          <div key={key} className={`px-2 py-1 rounded flex items-center ${getBgClasses('button')} text-xs`}>
            <KeyRound className="h-3 w-3 mr-1" />
            <span className="font-mono font-bold">{shortcut.key}</span>
            <span className="ml-1 hidden sm:inline">{shortcut.description}</span>
          </div>
        ))}
        
        <button 
          className={`px-2 py-1 rounded flex items-center ${getBgClasses('button')} text-xs`}
          onClick={() => setShowShortcutPanel(true)}
        >
          <Keyboard className="h-3 w-3 mr-1" />
          <span>Ajuda</span>
        </button>
      </div>
    </div>
  );
  
  // Settings panel content
  const SettingsContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-2">Tema</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            className={`p-3 rounded-lg flex flex-col items-center ${
              themeMode === 'light' 
                ? 'border-2 border-primary' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setThemeMode('light')}
          >
            <Sun className="h-6 w-6 mb-2 text-yellow-500" />
            <span>Claro</span>
          </button>
          
          <button 
            className={`p-3 rounded-lg flex flex-col items-center ${
              themeMode === 'dark' 
                ? 'border-2 border-primary' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setThemeMode('dark')}
          >
            <Moon className="h-6 w-6 mb-2 text-blue-500" />
            <span>Escuro</span>
          </button>
          
          <button 
            className={`p-3 rounded-lg flex flex-col items-center ${
              themeMode === 'custom' 
                ? 'border-2 border-primary' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setThemeMode('custom')}
          >
            <Palette className="h-6 w-6 mb-2 text-purple-500" />
            <span>Personalizado</span>
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Cor Principal</h3>
        <div className="grid grid-cols-6 gap-3">
          {[
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b', // Yellow
            '#ef4444', // Red
            '#8b5cf6', // Purple
            '#ec4899'  // Pink
          ].map((color) => (
            <button
              key={color}
              className={`h-10 rounded-lg ${
                primaryColor === color ? 'ring-2 ring-offset-2 dark:ring-offset, ring-primary' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setPrimaryColor(color)}
              aria-label={`Choose ${color} color`}
            />
          ))}
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Cor personalizada</label>
          <input 
            type="color" 
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Acessibilidade</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tamanho da Fonte</label>
            <select 
              className={`w-full rounded-lg ${getBgClasses('input')} border py-2 px-3`}
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            >
              <option value="small">Pequena</option>
              <option value="normal">Normal</option>
              <option value="large">Grande</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contraste</label>
            <select 
              className={`w-full rounded-lg ${getBgClasses('input')} border py-2 px-3`}
              value={contrast}
              onChange={(e) => setContrast(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="high">Alto Contraste</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Layout</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`p-3 rounded-lg flex flex-col items-center ${
              operationMode === 'counter' 
                ? 'border-2 border-primary' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => {
              if (cartItems.length > 0 && operationMode === 'tables') {
                if (window.confirm('Mudar o modo de operação cancelará a venda atual. Deseja continuar?')) {
                  clearCart();
                  setOperationMode('counter');
                }
              } else {
                setOperationMode('counter');
              }
            }}
          >
            <Store className="h-6 w-6 mb-2" />
            <span>Balcão</span>
          </button>
          
          <button 
            className={`p-3 rounded-lg flex flex-col items-center ${
              operationMode === 'tables' 
                ? 'border-2 border-primary' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => {
              if (cartItems.length > 0 && operationMode === 'counter') {
                if (window.confirm('Mudar o modo de operação cancelará a venda atual. Deseja continuar?')) {
                  clearCart();
                  setOperationMode('tables');
                }
              } else {
                setOperationMode('tables');
              }
            }}
          >
            <Table className="h-6 w-6 mb-2" />
            <span>Mesas</span>
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render function for the fixed shortcuts panel
  const ShortcutHelpPanel = () => (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Atalhos de Teclado</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Use estes atalhos para acessar as funções rapidamente:</p>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`bg-gray-50 dark:bg-gray-800`}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tecla</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Função</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {Object.values(shortcuts).map((shortcut, index) => (
              <tr key={shortcut.key} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                <td className="px-4 py-3 text-sm font-medium">{shortcut.key}</td>
                <td className="px-4 py-3 text-sm">{shortcut.description}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {
                    shortcut.key === 'F2' ? 'Foca no campo de busca de produtos' :
                    shortcut.key === 'F3' ? 'Remove o item selecionado do carrinho' :
                    shortcut.key === 'F4' ? 'Cancela todos os itens da venda atual' :
                    shortcut.key === 'F5' ? 'Avança para a tela de pagamento' :
                    shortcut.key === 'F6' ? 'Abre a gaveta de dinheiro' :
                    shortcut.key === 'F7' ? 'Reimprime o último comprovante emitido' :
                    shortcut.key === 'F8' ? 'Alterna entre modo balcão e mesas' :
                    shortcut.key === 'F9' ? 'Abre as configurações do PDV' :
                    shortcut.key === 'F10' ? 'Mostra o histórico de ações' :
                    shortcut.key === 'F12' ? 'Abre o painel de operações de caixa' :
                    ''
                  }
                </td>
              </tr>
            ))}
            <tr className="bg-white dark:bg-gray-800">
              <td className="px-4 py-3 text-sm font-medium">ESC</td>
              <td className="px-4 py-3 text-sm">Voltar / Cancelar</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Fecha painéis ou retorna à tela anterior
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Render function for the history panel
  const HistoryPanel = () => (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Histórico de Operações</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Últimas ações realizadas no PDV:</p>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`bg-gray-50 dark:bg-gray-800 sticky top-0`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Horário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Detalhes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuário</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Desfazer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {actionHistory.length > 0 ? (
                actionHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-xs">
                      {entry.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {entry.action === 'add_product' ? 'Adicionar Produto' :
                       entry.action === 'remove_product' ? 'Remover Produto' :
                       entry.action === 'update_quantity' ? 'Atualizar Quantidade' :
                       entry.action === 'clear_cart' ? 'Limpar Carrinho' :
                       entry.action === 'apply_discount' ? 'Aplicar Desconto' :
                       entry.action === 'checkout' ? 'Finalizar Venda' :
                       entry.action === 'reprint' ? 'Reimprimir Comprovante' :
                       entry.action === 'add_product_to_table' ? 'Adicionar à Mesa' :
                       entry.action === 'remove_product_from_table' ? 'Remover da Mesa' :
                       entry.action === 'update_quantity_table' ? 'Atualizar Qtd. Mesa' :
                       entry.action === 'clear_table_orders' ? 'Limpar Mesa' :
                       entry.action === 'table_checkout' ? 'Fechar Mesa' :
                       entry.action === 'open_drawer' ? 'Abrir Gaveta' :
                       entry.action === 'change_mode' ? 'Mudar Modo' :
                       entry.action === 'new_sale' ? 'Nova Venda' :
                       entry.action}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{entry.details}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{entry.user}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.undoable && entry.undoFunction ? (
                        <button 
                          className="text-primary hover:text-primary-dark font-medium text-xs"
                          onClick={() => {
                            if (entry.undoFunction) {
                              entry.undoFunction();
                              toast.success("Ação desfeita com sucesso");
                              
                              // Remove undo function to prevent multiple undos
                              setActionHistory(prev => 
                                prev.map(item => 
                                  item.id === entry.id ? { ...item, undoable: false, undoFunction: undefined } : item
                                )
                              );
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma ação registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-right mt-2">
        Histórico limitado às últimas 100 ações
      </p>
    </div>
  );
  
  // Tables mode view
  const renderTablesView = () => (
    <div className="h-full flex flex-col">
      {/* Tables grid */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Mesas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map(table => (
            <button
              key={table.id}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 p-4 ${
                table.status === 'free' 
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/30' 
                  : table.status === 'bill-requested'
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/30'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/30'
              }`}
              onClick={() => {
                setActiveTable(table);
                logAction('select_table', `Mesa ${table.number} selecionada`, false);
              }}
            >
              <Table className={`h-12 w-12 mb-2 ${
                table.status === 'free' 
                  ? 'text-green-500' 
                  : table.status === 'bill-requested'
                    ? 'text-yellow-500'
                    : 'text-blue-500'
              }`} />
              <span className="font-bold text-lg">Mesa {table.number}</span>
              <span className="text-sm">
                {table.status === 'free' 
                  ? 'Livre' 
                  : table.status === 'bill-requested'
                    ? 'Conta Solicitada'
                    : 'Ocupada'}
              </span>
              {table.status !== 'free' && table.orders.length > 0 && (
                <span className="text-xs mt-1">
                  {table.orders.length} {table.orders.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Table detail view
  const renderTableDetail = () => {
    if (!activeTable) return null;
    
    const tableCartItems = activeTable.orders || [];
    
    // Calculate table totals
    const tableSubtotal = tableCartItems.reduce((sum, item) => sum + item.total, 0);
    const tableDiscountAmount = discount.type === 'percentage' 
      ? tableSubtotal * (discount.amount / 100) 
      : Math.min(discount.amount, tableSubtotal);
    const tableTotal = tableSubtotal - tableDiscountAmount;
    
    const addCustomer = () => {
      const customerName = prompt('Nome do cliente:');
      if (customerName) {
        setTables(prev => {
          return prev.map(table => {
            if (table.id === activeTable.id) {
              return {
                ...table,
                customer: customerName,
                status: 'occupied',
                startTime: table.startTime || new Date()
              };
            }
            return table;
          });
        });
        
        logAction('add_table_customer', `Cliente "${customerName}" adicionado à mesa ${activeTable.number}`, true);
      }
    };
    
    return (
      <div className="h-full flex flex-col">
        {/* Table header */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setActiveTable(null)}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-xl font-semibold">Mesa {activeTable.number}</h2>
              <div className="flex items-center text-sm mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeTable.status === 'free' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                    : activeTable.status === 'bill-requested'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {activeTable.status === 'free' 
                    ? 'Livre' 
                    : activeTable.status === 'bill-requested'
                      ? 'Conta Solicitada'
                      : 'Ocupada'}
                </span>
                
                {activeTable.startTime && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {new Date(activeTable.startTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
                
                {activeTable.customer ? (
                  <span className="ml-2 flex items-center text-gray-600 dark:text-gray-300">
                    <User className="h-3 w-3 mr-1" />
                    {activeTable.customer}
                  </span>
                ) : (
                  <button 
                    className="ml-2 text-primary text-xs flex items-center"
                    onClick={addCustomer}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar cliente
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <button 
              className={`px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-dark`}
              onClick={() => {
                if (tableCartItems.length > 0) {
                  setCurrentView('payment');
                } else {
                  toast.error("Adicione itens para prosseguir com o pagamento");
                }
              }}
              disabled={tableCartItems.length === 0}
            >
              <DollarSign className="h-4 w-4 mr-1 inline" />
              Fechar Mesa
            </button>
          </div>
        </div>

        {/* Table content - reuse cart components */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tableCartItems.length === 0 ? (
            <div className={`h-40 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border rounded-lg ${getBgClasses('card')}`}>
              <ShoppingCart className="h-12 w-12 mb-2" />
              <p className="text-lg">Nenhum item adicionado</p>
              <p className="text-sm">Adicione produtos utilizando a barra de pesquisa ou o menu ao lado</p>
            </div>
          ) : (
            tableCartItems.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center p-3 rounded-lg ${getBgClasses('card')} border ${
                  selectedItemId === item.id ? 'ring-2 ring-primary' : ''
                } hover:shadow-sm`}
                onClick={() => selectItem(item.id)}
              >
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">{item.product_name}</h3>
                  <p className="text-gray-500 text-sm dark:text-gray-400">
                    {formatCurrency(item.unit_price)} • {item.product_sku}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <button 
                      className={`h-8 w-8 rounded-full ${getBgClasses('button')} flex items-center justify-center`}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="mx-3 font-medium w-5 text-center">{item.quantity}</span>
                    <button 
                      className={`h-8 w-8 rounded-full ${getBgClasses('button')} flex items-center justify-center`}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium mr-3 dark:text-white">{formatCurrency(item.total)}</span>
                    <button 
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.id);
                      }}
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Table footer with totals and actions */}
        <div className={`p-4 ${getBgClasses('sidebar')} border-t`}>
          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <button 
                className="btn-outline py-2 text-sm"
                onClick={() => {
                  const newNote = prompt('Observações:', activeTable.notes || '');
                  if (newNote !== null) {
                    setTables(prev => {
                      return prev.map(table => {
                        if (table.id === activeTable.id) {
                          return {
                            ...table,
                            notes: newNote
                          };
                        }
                        return table;
                      });
                    });
                    
                    logAction('update_table_notes', `Observações da mesa ${activeTable.number} atualizadas`, true);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                {activeTable.notes ? 'Editar Obs.' : 'Adicionar Obs.'}
              </button>
              
              <button 
                className="btn-outline py-2 text-sm"
                onClick={() => setShowDiscountPanel(true)}
              >
                <Percent className="h-4 w-4 mr-1" />
                {discount.amount > 0 ? `${discount.amount}${discount.type === 'percentage' ? '%' : ''} Off` : 'Desconto'}
              </button>
            </div>
            
            {tableCartItems.length > 0 && (
              <button 
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja remover todos os itens desta mesa?')) {
                    clearCart();
                  }
                }}
              >
                <Trash className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className={`rounded-lg ${getBgClasses('card')} p-3`}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="dark:text-white">{formatCurrency(tableSubtotal)}</span>
            </div>
            
            {discount.amount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Desconto:</span>
                <span className="text-red-600 dark:text-red-400">-{formatCurrency(tableDiscountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t dark:border-gray-700">
              <span className="dark:text-white">Total:</span>
              <span className="text-primary">{formatCurrency(tableTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render function for the main cart view
  const renderCartView = () => (
    <main className="flex-1 flex flex-col md:flex-row">
      {/* Left Panel - Cart */}
      <div className="md:w-3/5 border-r dark:border-gray-700 flex flex-col">
        {/* Barcode scanner */}
        <div className={`p-4 ${getBgClasses('card')} border-b dark:border-gray-700`}>
          <form onSubmit={handleBarcodeSubmit} className="flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Scan className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                className={`input pl-10 w-full py-3 rounded-lg ${getBgClasses('input')}`}
                placeholder="Escaneie o código de barras (F5)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <button type="submit" className={`ml-2 btn-outline px-3 rounded-lg ${getBgClasses('button')}`}>
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
        
        {/* Cart items */}
        <div className={`flex-1 overflow-y-auto p-4 ${getBgClasses('card')}`}>
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <ShoppingCart className="h-20 w-20 mb-4" />
              <h3 className="text-xl font-medium mb-1">Carrinho vazio</h3>
              <p className="text-center max-w-sm">
                Adicione produtos escaneando o código de barras ou selecionando-os no painel ao lado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center p-3 rounded-lg ${getBgClasses('card')} border ${
                    selectedItemId === item.id ? 'ring-2 ring-primary' : ''
                  } hover:shadow-sm`}
                  onClick={() => selectItem(item.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium dark:text-white">{item.product_name}</h3>
                    <p className="text-gray-500 text-sm dark:text-gray-400">
                      {formatCurrency(item.unit_price)} • {item.product_sku}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <button 
                        className={`h-8 w-8 rounded-full ${getBgClasses('button')} flex items-center justify-center`}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.quantity - 1);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="mx-3 font-medium w-5 text-center dark:text-white">{item.quantity}</span>
                      <button 
                        className={`h-8 w-8 rounded-full ${getBgClasses('button')} flex items-center justify-center`}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.quantity + 1);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="font-medium mr-3 dark:text-white">{formatCurrency(item.total)}</span>
                      <button 
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
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
        <div className={`p-4 ${getBgClasses('sidebar')} border-t dark:border-gray-700`}>
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button 
                className="btn-outline py-2 text-sm dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => setShowCustomerModal(true)}
              >
                {customer ? 'Alterar Cliente' : 'Cliente'}
              </button>
              
              <button 
                className="btn-outline py-2 text-sm dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => setShowDiscountPanel(true)}
              >
                <Percent className="h-4 w-4 mr-1" />
                {discount.amount > 0 ? `${discount.amount}${discount.type === 'percentage' ? '%' : ''} Off` : 'Desconto'}
              </button>
              
              <button 
                className="btn-outline py-2 text-sm dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => {
                  const newNote = prompt('Observações:', note);
                  if (newNote !== null) {
                    setNote(newNote);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                {note ? 'Editar Obs.' : 'Observações'}
              </button>
            </div>
            
            {cartItems.length > 0 && (
              <button 
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={clearCartWithConfirmation}
              >
                <Trash className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Totals and checkout */}
        <div className={`p-4 ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border-t dark:border-gray-700`}>
          {/* Totals */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            
            {discount.amount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Desconto:</span>
                <span className="text-red-600 dark:text-red-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t dark:border-gray-700">
              <span className="dark:text-white">Total:</span>
              <span className="text-primary dark:text-primary-light">{formatCurrency(total)}</span>
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
      <div className="md:w-2/5 flex flex-col">
        {/* Search and Categories */}
        <div className={`p-4 ${getBgClasses('card')} border-b dark:border-gray-700`}>
          <div className="flex mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className={`input pl-10 w-full rounded-lg ${getBgClasses('input')}`}
                placeholder="Buscar produto... (F2)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto py-1 scrollbar-hide">
            <button 
              className={`px-3 py-1 rounded-full whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-primary text-white dark:bg-primary-dark'
                  : `${getBgClasses('button')} dark:text-gray-300`
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
                    ? 'bg-primary text-white dark:bg-primary-dark'
                    : `${getBgClasses('button')} dark:text-gray-300`
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Products Grid */}
        <div className={`flex-1 overflow-y-auto p-4 ${themeMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts().map(product => (
              <button
                key={product.id}
                className={`p-4 ${getBgClasses('card')} rounded-lg border hover:shadow-sm transition-shadow text-left`}
                onClick={() => addToCart(product)}
              >
                <h3 className="font-medium dark:text-white mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                <div className="mt-2 font-bold text-primary dark:text-primary-light">{formatCurrency(product.price)}</div>
              </button>
            ))}
          </div>
          
          {filteredProducts().length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Search className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-medium mb-1">Nenhum produto encontrado</h3>
              <p className="text-center">
                Tente uma busca diferente ou selecione outra categoria
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
  
  // Render function for the payment view
  const renderPaymentView = () => (
    <div className={themeMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Header */}
      <header className={`${getBgClasses('header')} px-4 py-3 flex items-center`}>
        <button 
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setCurrentView('cart')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Pagamento</h1>
      </header>
      
      {/* Payment content */}
      <div className="container mx-auto p-4 max-w-5xl">
        <div className={`${getBgClasses('card')} rounded-lg shadow p-6 mb-6`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold dark:text-white">{formatCurrency(total)}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {getActiveCartItems().length} {getActiveCartItems().length === 1 ? 'item' : 'itens'}
              </p>
            </div>
            {customer && <CustomerDisplay />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                paymentMethod === 'card' 
                  ? 'border-primary bg-primary/5 dark:bg-primary-dark/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className={`h-10 w-10 mb-2 ${paymentMethod === 'card' ? 'text-primary dark:text-primary-light' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className={`font-medium ${paymentMethod === 'card' ? 'text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300'}`}>Cartão</span>
            </div>
            
            <div 
              className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                paymentMethod === 'pix' 
                  ? 'border-primary bg-primary/5 dark:bg-primary-dark/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('pix')}
            >
              <QrCode className={`h-10 w-10 mb-2 ${paymentMethod === 'pix' ? 'text-primary dark:text-primary-light' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className={`font-medium ${paymentMethod === 'pix' ? 'text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300'}`}>PIX</span>
            </div>
            
            <div 
              className={`p-6 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                paymentMethod === 'cash' 
                  ? 'border-primary bg-primary/5 dark:bg-primary-dark/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className={`h-10 w-10 mb-2 ${paymentMethod === 'cash' ? 'text-primary dark:text-primary-light' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className={`font-medium ${paymentMethod === 'cash' ? 'text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300'}`}>Dinheiro</span>
            </div>
          </div>
          
          {/* Payment details based on selected method */}
          {paymentMethod && (
            <>
              {paymentMethod === 'card' && (
                <div className={`border rounded-lg p-6 ${getBgClasses('card')}`}>
                  <h3 className="font-medium text-lg mb-4 dark:text-white">Pagamento com Cartão</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                        <select className={`input w-full rounded-lg ${getBgClasses('input')}`}>
                          <option value="credit">Crédito</option>
                          <option value="debit">Débito</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parcelas</label>
                        <select className={`input w-full rounded-lg ${getBgClasses('input')}`}>
                          <option value="1">1x (à vista)</option>
                          <option value="2">2x sem juros</option>
                          <option value="3">3x sem juros</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm dark:text-gray-400">
                      Insira ou aproxime o cartão na máquina e siga as instruções.
                    </p>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'pix' && (
                <div className={`border rounded-lg p-6 ${getBgClasses('card')}`}>
                  <h3 className="font-medium text-lg mb-4 dark:text-white">Pagamento com PIX</h3>
                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-white p-4 border rounded-lg dark:bg-gray-200">
                      <QrCode className="h-40 w-40 text-gray-800" />
                    </div>
                  </div>
                  <p className="text-center text-gray-500 text-sm mb-4 dark:text-gray-400">
                    Escaneie o QR Code acima com o app do seu banco para pagar.
                  </p>
                </div>
              )}
              
              {paymentMethod === 'cash' && (
                <div className={`border rounded-lg p-6 ${getBgClasses('card')}`}>
                  <h3 className="font-medium text-lg mb-4 dark:text-white">Pagamento em Dinheiro</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Recebido</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 sm:text-sm">R$</span>
                        </div>
                        <input
                          type="number"
                          min={total}
                          step="0.01"
                          className={`input pl-10 rounded-lg ${getBgClasses('input')}`}
                          placeholder="0.00"
                          defaultValue={Math.ceil(total / 5) * 5} // Round up to nearest 5
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 20, 50, 100].map(amount => (
                        <button 
                          key={amount}
                          className={`p-2 border rounded text-center ${getBgClasses('button')}`}
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 mt-3 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="dark:text-gray-300">Valor da Compra:</span>
                        <span className="font-medium dark:text-white">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="dark:text-gray-300">Valor Recebido:</span>
                        <span className="font-medium dark:text-white">{formatCurrency(Math.ceil(total / 5) * 5)}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-lg font-bold">
                        <span className="dark:text-white">Troco:</span>
                        <span className="text-primary dark:text-primary-light">{formatCurrency(Math.ceil(total / 5) * 5 - total)}</span>
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
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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
    </div>
  );
  
  // Render function for the receipt view
  const renderReceiptView = () => (
    <div className={themeMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Header */}
      <header className={`${getBgClasses('header')} px-4 py-3 flex items-center`}>
        <h1 className="text-xl font-semibold dark:text-white">Comprovante de Venda</h1>
      </header>
      
      {/* Receipt content */}
      <div className="container mx-auto p-4 max-w-3xl">
        <div className={`${getBgClasses('card')} rounded-lg shadow p-6 mb-6`}>
          <div className="flex items-center justify-center mb-8">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Venda Finalizada!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              {formatCurrency(total)} • {getActiveCartItems().length} {getActiveCartItems().length === 1 ? 'item' : 'itens'}
            </p>
            
            {paymentMethod === 'cash' && (
              <div className="mt-3">
                <div className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <p className="text-green-800 dark:text-green-200">
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
                <button className="flex-1 btn-outline py-3 flex items-center justify-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
            className="w-full mt-6 text-primary dark:text-primary-light"
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
            items={getActiveCartItems()}
            companyName="Casa dos Pães"
            companyDocument="12.345.678/0001-90"
            companyAddress="Av. Paulista, 1234 - São Paulo/SP"
            companyPhone="(11) 5555-1234"
          />
        </div>
      </div>
    </div>
  );
  
  // Render function for the fiscal document view
  const renderFiscalView = () => (
    <div className={themeMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Header */}
      <header className={`${getBgClasses('header')} px-4 py-3 flex items-center`}>
        <button 
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setCurrentView('receipt')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Documento Fiscal</h1>
      </header>
      
      {/* Fiscal document content */}
      <div className="container mx-auto p-4 max-w-3xl">
        <div className={`${getBgClasses('card')} rounded-lg shadow p-6 mb-6`}>
          <h2 className="text-xl font-semibold mb-6 dark:text-white">Emissão de Documento Fiscal</h2>
          
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Selecione o tipo de documento fiscal que deseja emitir para esta venda:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`border rounded-lg p-4 ${getBgClasses('card')} hover:border-primary cursor-pointer`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium dark:text-white">NFC-e</h3>
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nota Fiscal de Consumidor Eletrônica, ideal para vendas a consumidor final.
                </p>
                <button className="w-full mt-4 btn-primary py-2 text-sm">
                  Emitir NFC-e
                </button>
              </div>
              
              <div className={`border rounded-lg p-4 ${getBgClasses('card')} hover:border-primary cursor-pointer`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium dark:text-white">NF-e</h3>
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nota Fiscal Eletrônica, para vendas a empresas ou quando solicitado pelo cliente.
                </p>
                <button className="w-full mt-4 btn-outline py-2 text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Emitir NF-e
                </button>
              </div>
            </div>
            
            {!customer && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-900 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Nenhum cliente selecionado. Para NF-e é necessário informar o cliente.
                    </p>
                    <button className="mt-2 text-sm font-medium text-primary dark:text-primary-light">
                      Adicionar Cliente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-between">
            <button 
              className="btn-outline py-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setCurrentView('receipt')}
            >
              Voltar
            </button>
            
            <button 
              className="btn-primary py-2"
              onClick={startNewSale}
            >
              Concluir e Iniciar Nova Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Main render function
  return (
    <div 
      ref={mainContainerRef}
      className={getThemeClasses()}
      style={{ 
        // Set dynamic CSS variables for the theme
        '--primary': primaryColor || '#3b82f6',
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className={`${getBgClasses('header')} px-4 py-3 border-b`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/sales" className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold dark:text-white">
              {operationMode === 'counter' 
                ? 'PDV - Balcão' 
                : activeTable 
                  ? `Mesa ${activeTable.number}` 
                  : 'PDV - Mesas'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isSessionOpen && (
              <div className="flex items-center text-red-600 text-sm bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Caixa Fechado
              </div>
            )}
            
            {customer && <CustomerDisplay />}
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Histórico de Ações"
              >
                <History className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setShowSettingsPanel(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Configurações"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setShowCashierModal(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Operações de Caixa"
              >
                <CircleDollarSign className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleOperationMode}
                className={`px-3 py-1 rounded-lg flex items-center ${getBgClasses('button')}`}
                title="Alternar Modo"
              >
                {operationMode === 'counter' ? (
                  <>
                    <Table className="h-4 w-4 mr-1.5" />
                    <span className="text-sm hidden md:inline">Mesas</span>
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 mr-1.5" />
                    <span className="text-sm hidden md:inline">Balcão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content based on view and mode */}
      {currentView === 'cart' ? (
        operationMode === 'tables' ? (
          activeTable ? renderTableDetail() : renderTablesView()
        ) : (
          renderCartView()
        )
      ) : currentView === 'payment' ? (
        renderPaymentView()
      ) : currentView === 'receipt' ? (
        renderReceiptView()
      ) : (
        renderFiscalView()
      )}
      
      {/* Shortcuts bar - fixed at the bottom */}
      <ShortcutsBar />
      
      {/* Settings Modal */}
      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${getBgClasses('card')} rounded-lg shadow-lg max-w-md w-full`}>
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white">Configurações</h2>
                <button 
                  onClick={() => setShowSettingsPanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <SettingsContent />
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button 
                className="btn-primary"
                onClick={() => setShowSettingsPanel(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${getBgClasses('card')} rounded-lg shadow-lg max-w-md w-full`}>
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Selecionar Cliente</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar Cliente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={`input pl-10 w-full rounded-lg ${getBgClasses('input')}`}
                    placeholder="Nome, documento, telefone..."
                  />
                </div>
              </div>
              
              <div className={`py-3 border-t border-b dark:border-gray-700 space-y-3`}>
                <div 
                  className={`p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
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
                    setShowCustomerModal(false);
                    
                    logAction('add_customer', 'Cliente "Maria Silva" adicionado à venda', true,
                      () => setCustomer(null)
                    );
                  }}
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium dark:text-white">Maria Silva</h3>
                    <Tag className="h-4 w-4 text-primary dark:text-primary-light" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CPF: 123.456.789-00</p>
                </div>
                
                <div 
                  className={`p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
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
                    setShowCustomerModal(false);
                    
                    logAction('add_customer', 'Cliente "João Ferreira" adicionado à venda', true,
                      () => setCustomer(null)
                    );
                  }}
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium dark:text-white">João Ferreira</h3>
                    <Tag className="h-4 w-4 text-primary dark:text-primary-light" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CPF: 987.654.321-00</p>
                </div>
              </div>
              
              <div className="mt-4">
                <button className="btn-outline w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Novo Cliente
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-end rounded-b-lg">
              <button 
                className="btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowCustomerModal(false)}
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
          <div className={`${getBgClasses('card')} rounded-lg shadow-lg max-w-md w-full`}>
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Aplicar Desconto</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Desconto
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      discount.type === 'percentage'
                        ? 'bg-primary text-white'
                        : `border ${getBgClasses('button')} dark:border-gray-600`
                    }`}
                    onClick={() => setDiscount({ ...discount, type: 'percentage' })}
                  >
                    Percentual (%)
                  </button>
                  
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      discount.type === 'value'
                        ? 'bg-primary text-white'
                        : `border ${getBgClasses('button')} dark:border-gray-600`
                    }`}
                    onClick={() => setDiscount({ ...discount, type: 'value' })}
                  >
                    Valor (R$)
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {discount.type === 'percentage' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                      {discount.type === 'percentage' ? '%' : 'R$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={discount.type === 'percentage' ? '1' : '0.01'}
                    max={discount.type === 'percentage' ? '100' : subtotal}
                    className={`input pl-10 w-full rounded-lg ${getBgClasses('input')}`}
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
                        className={`py-1 border rounded-lg text-sm text-center ${getBgClasses('button')} dark:border-gray-600`}
                        onClick={() => setDiscount({ ...discount, amount })}
                      >
                        {amount}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`p-3 ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Desconto:</span>
                  <span className="text-red-600 dark:text-red-400">
                    -{formatCurrency(
                      discount.type === 'percentage' 
                        ? subtotal * (discount.amount / 100) 
                        : Math.min(discount.amount, subtotal)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 mt-1 border-t dark:border-gray-700">
                  <span className="dark:text-white">Total:</span>
                  <span className="dark:text-white">{formatCurrency(
                    subtotal - (
                      discount.type === 'percentage' 
                        ? subtotal * (discount.amount / 100) 
                        : Math.min(discount.amount, subtotal)
                    )
                  )}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-between rounded-b-lg">
              <button 
                className="btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowDiscountPanel(false)}
              >
                Cancelar
              </button>
              
              <button 
                className="btn-primary"
                onClick={applyDiscount}
              >
                Aplicar Desconto
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cashier Modal */}
      {showCashierModal && (
        <CashierOperations onClose={() => setShowCashierModal(false)} />
      )}
      
      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${getBgClasses('card')} rounded-lg shadow-lg max-w-4xl w-full`}>
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white">Histórico de Operações</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto">
              <HistoryPanel />
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button 
                className="btn-primary"
                onClick={() => setShowHistory(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts help */}
      {showShortcutPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${getBgClasses('card')} rounded-lg shadow-lg max-w-2xl w-full`}>
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white flex items-center">
                  <Keyboard className="h-5 w-5 mr-2" />
                  Atalhos de Teclado
                </h2>
                <button 
                  onClick={() => setShowShortcutPanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto">
              <ShortcutHelpPanel />
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button 
                className="btn-primary"
                onClick={() => setShowShortcutPanel(false)}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVModern;