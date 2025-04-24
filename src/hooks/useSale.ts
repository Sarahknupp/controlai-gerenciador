import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCashier } from '../contexts/CashierContext';
import { 
  Product, 
  Sale, 
  SaleItem, 
  SaleStatus, 
  PaymentDetails, 
  Customer,
  FiscalDocumentType
} from '../types/pos';
import { fiscalService } from '../services/fiscalService';
import { inventoryService } from '../services/inventoryService';
import { financialService } from '../services/financialService';
import { useAuth } from '../contexts/AuthContext';

// Local storage key for cart items
const CART_STORAGE_KEY = 'pdv_current_cart';

interface UseSaleProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useSale({ onSuccess, onError }: UseSaleProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentSession, isSessionOpen } = useCashier();
  
  // Sale state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState<{
    type: 'percentage' | 'value' | 'points';
    value: number;
    reason?: string;
  }>({ type: 'percentage', value: 0 });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([
    { method: 'cash', amount: 0 }
  ]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  
  // Auto-save cart to local storage
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cartItems]);
  
  // Load cart from local storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }, []);
  
  // Calculated values
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0) || 0;
  
  const calculateDiscount = useCallback(() => {
    if (discount.value <= 0) return 0;
    
    if (discount.type === 'percentage') {
      return (discount.value / 100) * subtotal;
    } else if (discount.type === 'value') {
      return Math.min(discount.value, subtotal); // Cannot exceed subtotal
    } else if (discount.type === 'points' && customer?.points) {
      // Assuming 1 point = R$ 0.05 discount
      const maxPointsDiscount = customer.points * 0.05;
      return Math.min(discount.value * 0.05, maxPointsDiscount, subtotal);
    }
    
    return 0;
  }, [discount, subtotal, customer]);
  
  const discountAmount = calculateDiscount();
  
  const totalTaxes = cartItems.reduce((sum, item) => {
    return sum + (item.tax_amount || 0);
  }, 0);
  
  const total = subtotal - discountAmount;
  
  const totalPaid = paymentDetails.reduce((sum, pd) => sum + pd.amount, 0);
  
  const changeAmount = paymentDetails.reduce((sum, pd) => {
    // Only cash payments generate change
    if (pd.method === 'cash' && pd.received_amount && pd.received_amount > pd.amount) {
      return sum + (pd.received_amount - pd.amount);
    }
    return sum;
  }, 0);
  
  const canCompleteSale = cartItems.length > 0 && totalPaid >= total;
  
  // Add a product to the cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (!product) return;
    
    setCartItems(prevItems => {
      // Check if product already exists in cart
      const existingIndex = prevItems.findIndex(item => item.product_id === product.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingIndex];
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = product.price * newQuantity;
        
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal,
          tax_amount: newTotal * (product.tax_rate / 100)
        };
        
        return updatedItems;
      } else {
        // Add new item
        const total = product.price * quantity;
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
          tax_amount: total * (product.tax_rate / 100)
        };
        
        return [...prevItems, newItem];
      }
    });
  }, []);
  
  // Remove an item from the cart
  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);
  
  // Update an item's quantity
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const newTotal = item.unit_price * newQuantity;
          return {
            ...item,
            quantity: newQuantity,
            total: newTotal,
            tax_amount: newTotal * (item.tax_rate / 100)
          };
        }
        return item;
      });
    });
  }, [removeFromCart]);
  
  // Clear the entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCustomer(null);
    setDiscount({ type: 'percentage', value: 0 });
    setPaymentDetails([{ method: 'cash', amount: 0 }]);
    setCompletedSale(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);
  
  // Update discount details
  const updateDiscount = useCallback((
    type: 'percentage' | 'value' | 'points', 
    value: number, 
    reason?: string
  ) => {
    setDiscount({ type, value, reason });
  }, []);
  
  // Update customer
  const setSelectedCustomer = useCallback((newCustomer: Customer | null) => {
    setCustomer(newCustomer);
    
    // If customer has a default discount, apply it
    if (newCustomer?.discount_rate) {
      setDiscount({
        type: 'percentage',
        value: newCustomer.discount_rate,
        reason: 'Desconto de cliente'
      });
    }
  }, []);
  
  // Update payment methods
  const updatePaymentMethod = useCallback((index: number, method: string) => {
    setPaymentDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], method: method as any };
      return updated;
    });
  }, []);
  
  // Update payment amount
  const updatePaymentAmount = useCallback((index: number, amount: number) => {
    setPaymentDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount };
      return updated;
    });
  }, []);
  
  // Add new payment method
  const addPaymentMethod = useCallback(() => {
    setPaymentDetails(prev => [...prev, { method: 'credit', amount: 0 }]);
  }, []);
  
  // Remove payment method
  const removePaymentMethod = useCallback((index: number) => {
    if (paymentDetails.length <= 1) return;
    
    setPaymentDetails(prev => prev.filter((_, i) => i !== index));
  }, [paymentDetails]);
  
  // Set cash payment received amount
  const setCashReceived = useCallback((amount: number) => {
    setPaymentDetails(prev => {
      const updated = [...prev];
      const cashIndex = updated.findIndex(p => p.method === 'cash');
      
      if (cashIndex >= 0) {
        updated[cashIndex] = { 
          ...updated[cashIndex], 
          received_amount: amount,
          // If received is less than total, use received as payment amount
          // If received is more than total, the difference is change
          amount: amount > total ? total : amount
        };
        
        if (amount > total) {
          updated[cashIndex].change_amount = amount - total;
        } else {
          updated[cashIndex].change_amount = undefined;
        }
      } else {
        // If no cash payment exists, add one
        const paymentAmount = amount > total ? total : amount;
        updated.push({
          method: 'cash',
          amount: paymentAmount,
          received_amount: amount,
          change_amount: amount > total ? amount - paymentAmount : undefined
        });
      }
      
      return updated;
    });
  }, [total]);
  
  // Process payment and complete sale
  const completeSale = useCallback(async (
    fiscalDocumentType: FiscalDocumentType = 'nfce'
  ): Promise<Sale | null> => {
    if (!user || !currentSession) {
      const errorMessage = !user ? 'Usuário não autenticado' : 'Sessão de caixa não inicializada';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    }
    
    if (!isSessionOpen) {
      const errorMessage = 'Não há um caixa aberto';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    }
    
    if (cartItems.length === 0) {
      const errorMessage = 'Carrinho vazio';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    }
    
    if (totalPaid < total) {
      const errorMessage = 'Valor pago é menor que o total da venda';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    }
    
    setProcessingPayment(true);
    setIsLoading(true);
    
    try {
      // Check inventory before proceeding
      const stockCheck = await inventoryService.checkStockAvailability(
        cartItems.map(item => ({ 
          product_id: item.product_id, 
          quantity: item.quantity 
        }))
      );
      
      if (stockCheck.length > 0) {
        throw new Error(`Estoque insuficiente para: ${stockCheck.map(p => p.name).join(', ')}`);
      }
      
      // Process payment through payment service for non-cash methods
      // In a real app, this would integrate with payment terminals/gateways
      for (const payment of paymentDetails) {
        if (payment.method !== 'cash' && payment.method !== 'other') {
          const paymentResult = await financialService.processPayment(
            'temp-sale',
            payment.amount,
            payment.method
          );
          
          if (!paymentResult.success) {
            throw new Error(`Erro no pagamento: ${paymentResult.message}`);
          }
          
          // Store the transaction details
          payment.integration = {
            transaction_id: paymentResult.transaction_id,
            authorization_code: paymentResult.authorization_code
          };
        }
      }
      
      // Create the sale record
      const now = new Date().toISOString();
      const newSale: Omit<Sale, 'id'> = {
        customer_id: customer?.id,
        operator_id: user.id,
        terminal_id: window.location.hostname, // In a real app, this would be a proper terminal ID
        cashier_session_id: currentSession.id,
        subtotal: subtotal,
        discount_amount: discountAmount,
        discount_type: discount.type,
        discount_reason: discount.reason,
        tax_amount: totalTaxes,
        total: total,
        status: 'pending',
        payment_details: paymentDetails,
        created_at: now,
        notes: '',
        customer: customer ? {
          name: customer.name,
          document: customer.document_number
        } : undefined,
        fiscal_document_status: 'pending'
      } as unknown as Omit<Sale, 'id'>;
      
      // Save to database
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(newSale)
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      if (!saleData) throw new Error('Erro ao criar venda');
      
      // Update sale ID in cart items and insert them
      const saleItems = cartItems.map(item => ({
        ...item,
        id: undefined, // Let the database generate IDs
        sale_id: saleData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Update inventory
      const inventoryUpdated = await inventoryService.updateInventoryFromSale(
        saleData as Sale,
        cartItems
      );
      
      if (!inventoryUpdated) {
        console.warn('Falha ao atualizar estoque, continuando com a venda');
      }
      
      // Register financial transaction
      const transactionRegistered = await financialService.registerSaleTransaction(
        saleData as Sale
      );
      
      if (!transactionRegistered) {
        console.warn('Falha ao registrar transação financeira, continuando com a venda');
      }
      
      // Process fiscal document (NFC-e/NFe)
      if (fiscalDocumentType !== 'none') {
        try {
          const fiscalDoc = await fiscalService.issueFiscalDocument(
            saleData as Sale,
            cartItems,
            fiscalDocumentType
          );
          
          // Update sale with fiscal document info
          await supabase
            .from('sales')
            .update({
              fiscal_document_id: fiscalDoc.id,
              fiscal_document_number: fiscalDoc.document_number,
              fiscal_document_status: fiscalDoc.status,
            })
            .eq('id', saleData.id);
        } catch (fiscalError) {
          console.error("Error issuing fiscal document:", fiscalError);
          // Continue with the sale even if fiscal document fails
          // The document can be issued later
        }
      }
      
      // Mark sale as completed
      const { data: completedData, error: completeError } = await supabase
        .from('sales')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', saleData.id)
        .select()
        .single();
      
      if (completeError) throw completeError;
      
      // Update customer points if applicable
      if (customer?.id && customer.points !== undefined) {
        // Award 1 point for each R$10 spent
        const pointsEarned = Math.floor(total / 10);
        
        if (pointsEarned > 0) {
          await supabase.rpc('update_customer_points', {
            customer_id: customer.id,
            points_to_add: pointsEarned,
            points_to_remove: discount.type === 'points' ? discount.value : 0
          });
        }
      }
      
      // Complete operation
      setCompletedSale(completedData as Sale);
      
      if (onSuccess) {
        onSuccess('Venda concluída com sucesso');
      }
      
      return completedData as Sale;
    } catch (error) {
      console.error("Error completing sale:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao processar venda';
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    } finally {
      setProcessingPayment(false);
      setIsLoading(false);
    }
  }, [
    user, currentSession, isSessionOpen, cartItems, total, totalPaid, subtotal,
    discountAmount, totalTaxes, discount, paymentDetails, customer, onSuccess, onError
  ]);
  
  // Cancel a completed sale
  const cancelSale = useCallback(async (
    saleId: string, 
    reason: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      if (onError) onError('Usuário não autenticado');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the sale details
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`*, sale_items(*)`)
        .eq('id', saleId)
        .single();
      
      if (saleError) throw saleError;
      if (!saleData) throw new Error('Venda não encontrada');
      
      // Check if the sale can be cancelled
      if (saleData.status === 'cancelled') {
        throw new Error('Esta venda já foi cancelada');
      }
      
      if (saleData.status !== 'completed') {
        throw new Error('Apenas vendas concluídas podem ser canceladas');
      }
      
      // Cancel any fiscal documents if they exist
      if (saleData.fiscal_document_id) {
        try {
          const cancelResult = await fiscalService.cancelDocument(
            saleData.fiscal_document_id,
            reason
          );
          
          if (!cancelResult.success) {
            throw new Error(`Erro ao cancelar documento fiscal: ${cancelResult.message}`);
          }
        } catch (fiscalError) {
          console.error("Error cancelling fiscal document:", fiscalError);
          // Continue with the cancellation even if fiscal document cancellation fails
        }
      }
      
      // Update inventory (return items to stock)
      const inventoryUpdated = await inventoryService.updateInventoryFromCancellation(
        saleData,
        saleData.sale_items
      );
      
      if (!inventoryUpdated) {
        console.warn('Falha ao atualizar estoque, continuando com o cancelamento');
      }
      
      // Register cancellation financial transaction
      const transactionRegistered = await financialService.registerCancellationTransaction(
        saleData
      );
      
      if (!transactionRegistered) {
        console.warn('Falha ao registrar transação de cancelamento, continuando');
      }
      
      // Update sale as cancelled
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          notes: `${saleData.notes || ''}\nCancelamento: ${reason}`
        })
        .eq('id', saleId);
      
      if (updateError) throw updateError;
      
      if (onSuccess) {
        onSuccess('Venda cancelada com sucesso');
      }
      
      return true;
    } catch (error) {
      console.error("Error cancelling sale:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao cancelar venda';
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, onSuccess, onError]);
  
  // Load a sale by ID
  const loadSale = useCallback(async (
    saleId: string
  ): Promise<{sale: Sale; items: SaleItem[]} | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(*),
          customers(*)
        `)
        .eq('id', saleId)
        .single();
      
      if (error) throw error;
      
      if (!data) throw new Error('Venda não encontrada');
      
      // Format the response
      const sale = data as Sale;
      const items = data.sale_items as SaleItem[];
      const customer = data.customers as Customer;
      
      return { sale, items };
    } catch (error) {
      console.error("Error loading sale:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao carregar venda';
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Return from cart to PDV
  const returnToPDV = useCallback(() => {
    navigate('/pos');
  }, [navigate]);
  
  return {
    // State
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
    
    // Functions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateDiscount,
    setCustomer: setSelectedCustomer,
    updatePaymentMethod,
    updatePaymentAmount,
    addPaymentMethod,
    removePaymentMethod,
    setCashReceived,
    completeSale,
    cancelSale,
    loadSale,
    returnToPDV,
    canCompleteSale
  };
}

export default useSale;