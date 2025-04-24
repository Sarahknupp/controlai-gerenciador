import { supabase } from '../lib/supabase';
import { Sale, CashFlow, PaymentMethod, PaymentDetails } from '../types/pos';

/**
 * Service for handling financial operations
 */
export class FinancialService {
  /**
   * Register a financial transaction from a sale
   */
  async registerSaleTransaction(sale: Sale): Promise<boolean> {
    try {
      // Create financial transaction records for each payment method
      const transactions = sale.payment_details.map(payment => ({
        type: 'income',
        amount: payment.amount,
        description: `Venda #${sale.id}`,
        payment_method: payment.method,
        reference_id: sale.id,
        reference_type: 'sale',
        cashier_session_id: sale.cashier_session_id,
        operator_id: sale.operator_id,
        created_at: new Date().toISOString(),
        status: 'completed'
      }));
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactions);
      
      if (error) throw error;
      
      // For cash payments, also register a cash flow record
      const cashPayments = sale.payment_details.filter(p => p.method === 'cash');
      
      if (cashPayments.length > 0) {
        const totalCash = cashPayments.reduce((sum, p) => sum + p.amount, 0);
        
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            session_id: sale.cashier_session_id,
            amount: totalCash,
            operation_type: 'sale',
            notes: `Venda #${sale.id}`,
            reference_id: sale.id,
            operator_id: sale.operator_id
          });
        
        if (cashFlowError) throw cashFlowError;
      }
      
      return true;
    } catch (error) {
      console.error("Error registering sale transaction:", error);
      return false;
    }
  }
  
  /**
   * Register a transaction for a sale cancellation
   */
  async registerCancellationTransaction(sale: Sale): Promise<boolean> {
    try {
      // Create financial transaction records for each payment method
      const transactions = sale.payment_details.map(payment => ({
        type: 'expense', // Outgoing due to refund
        amount: payment.amount,
        description: `Cancelamento Venda #${sale.id}`,
        payment_method: payment.method,
        reference_id: sale.id,
        reference_type: 'cancellation',
        cashier_session_id: sale.cashier_session_id,
        operator_id: sale.operator_id,
        created_at: new Date().toISOString(),
        status: 'completed'
      }));
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactions);
      
      if (error) throw error;
      
      // For cash payments, also register a cash flow record
      const cashPayments = sale.payment_details.filter(p => p.method === 'cash');
      
      if (cashPayments.length > 0) {
        const totalCash = cashPayments.reduce((sum, p) => sum + p.amount, 0);
        
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            session_id: sale.cashier_session_id,
            amount: -totalCash, // Negative for cash outflow
            operation_type: 'refund',
            notes: `Cancelamento Venda #${sale.id}`,
            reference_id: sale.id,
            operator_id: sale.operator_id
          });
        
        if (cashFlowError) throw cashFlowError;
      }
      
      return true;
    } catch (error) {
      console.error("Error registering cancellation transaction:", error);
      return false;
    }
  }
  
  /**
   * Get sales summary for a time period
   */
  async getSalesSummary(
    startDate: string, 
    endDate: string, 
    sessionId?: string
  ): Promise<{
    total_sales: number;
    total_amount: number;
    by_payment_method: { method: string; amount: number }[];
    by_hour: { hour: number; count: number; amount: number }[];
  }> {
    try {
      // Use RPC for efficient server-side calculation
      const { data, error } = await supabase.rpc('get_sales_summary', {
        start_date: startDate,
        end_date: endDate,
        session_id: sessionId
      });
      
      if (error) throw error;
      
      return data || {
        total_sales: 0,
        total_amount: 0,
        by_payment_method: [],
        by_hour: []
      };
    } catch (error) {
      console.error("Error getting sales summary:", error);
      
      // Return empty result on error
      return {
        total_sales: 0,
        total_amount: 0,
        by_payment_method: [],
        by_hour: []
      };
    }
  }
  
  /**
   * Get payment methods
   */
  async getPaymentMethods(activeOnly: boolean = true): Promise<{
    id: string;
    name: string;
    type: PaymentMethod;
    icon?: string;
    requires_integration: boolean;
    integration_data?: any;
    is_active: boolean;
  }[]> {
    try {
      let query = supabase
        .from('payment_methods')
        .select('*')
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return [];
    }
  }
  
  /**
   * Process payment through payment gateway integration
   */
  async processPayment(
    saleId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    integrationDetails?: any
  ): Promise<{
    success: boolean;
    transaction_id?: string;
    authorization_code?: string;
    message: string;
  }> {
    try {
      if (paymentMethod === 'cash' || paymentMethod === 'other') {
        // No integration needed for cash payments
        return {
          success: true,
          message: 'Pagamento em dinheiro registrado'
        };
      }
      
      if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        // Simulate integration with payment terminal
        console.log(`Processing ${paymentMethod} payment for sale ${saleId}`);
        
        // Call the payment gateway API (simulated)
        // In a real app, this would interact with a payment SDK
        const simulatedResponse = {
          success: true,
          transaction_id: `TR${Date.now()}`,
          authorization_code: Math.random().toString(36).slice(2, 10).toUpperCase(),
          message: `Pagamento por ${paymentMethod} autorizado`
        };
        
        // Wait for response, simulating network latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return simulatedResponse;
      }
      
      if (paymentMethod === 'pix') {
        // Generate a PIX payment code
        return {
          success: true,
          transaction_id: `PIX${Date.now()}`,
          message: 'Código PIX gerado com sucesso'
        };
      }
      
      // For other payment methods
      return {
        success: true,
        message: `Pagamento por ${paymentMethod} registrado`
      };
    } catch (error) {
      console.error("Error processing payment:", error);
      return {
        success: false,
        message: 'Erro ao processar pagamento'
      };
    }
  }
  
  /**
   * Get transaction summary for dashboard
   */
  async getTransactionSummary(
    days: number = 30
  ): Promise<{
    income: { date: string; amount: number }[];
    expense: { date: string; amount: number }[];
    balance: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase.rpc('get_transaction_summary', {
        start_date: startDate.toISOString(),
        days_count: days
      });
      
      if (error) throw error;
      
      return data || { income: [], expense: [], balance: 0 };
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      return { income: [], expense: [], balance: 0 };
    }
  }
  
  /**
   * Get sales by category for reporting
   */
  async getSalesByCategory(
    startDate: string,
    endDate: string
  ): Promise<{ category: string; amount: number; percentage: number }[]> {
    try {
      const { data, error } = await supabase.rpc('get_sales_by_category', {
        start_date: startDate,
        end_date: endDate
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error getting sales by category:", error);
      return [];
    }
  }
  
  /**
   * Apply a coupon or discount code to a sale
   */
  async validateDiscountCode(
    code: string,
    saleTotal: number
  ): Promise<{
    valid: boolean;
    discount_type?: 'percentage' | 'value';
    discount_value?: number;
    message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single();
      
      if (error) {
        return {
          valid: false,
          message: 'Código de desconto inválido ou expirado'
        };
      }
      
      if (data.min_purchase && saleTotal < data.min_purchase) {
        return {
          valid: false,
          message: `Valor mínimo para este cupom: R$ ${data.min_purchase.toFixed(2)}`
        };
      }
      
      return {
        valid: true,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        message: 'Cupom aplicado com sucesso'
      };
    } catch (error) {
      console.error("Error validating discount code:", error);
      return {
        valid: false,
        message: 'Erro ao validar cupom de desconto'
      };
    }
  }
}

// Create a singleton instance for use throughout the application
export const financialService = new FinancialService();
export default financialService;