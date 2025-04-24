import { supabase } from '../lib/supabase';
import { Product, Sale, SaleItem } from '../types/pos';

/**
 * Service for handling inventory operations and product management
 */
export class InventoryService {
  // Cache for products to prevent excessive database calls
  private productsCache: Map<string, Product> = new Map();
  private lastCacheUpdate: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get a product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    // Check cache first
    if (this.productsCache.has(id) && Date.now() - this.lastCacheUpdate < this.cacheTTL) {
      return this.productsCache.get(id) || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        this.productsCache.set(id, data as Product);
      }
      
      return data as Product || null;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      return null;
    }
  }
  
  /**
   * Get a product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();
      
      if (error) throw error;
      
      if (data) {
        this.productsCache.set(data.id, data as Product);
      }
      
      return data as Product || null;
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      return null;
    }
  }
  
  /**
   * Get a product by SKU
   */
  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();
      
      if (error) throw error;
      
      if (data) {
        this.productsCache.set(data.id, data as Product);
      }
      
      return data as Product || null;
    } catch (error) {
      console.error("Error fetching product by SKU:", error);
      return null;
    }
  }
  
  /**
   * Search products by name, barcode or SKU
   */
  async searchProducts(query: string, categoryId?: string, limit: number = 20): Promise<Product[]> {
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);
      
      if (categoryId) {
        queryBuilder = queryBuilder.eq('category_id', categoryId);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      
      // Update cache
      for (const product of data || []) {
        this.productsCache.set(product.id, product as Product);
      }
      
      this.lastCacheUpdate = Date.now();
      
      return data as Product[] || [];
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }
  
  /**
   * Get popular products
   */
  async getPopularProducts(limit: number = 12): Promise<Product[]> {
    try {
      // In a real app, you'd have a view or table with popularity metrics
      // This is a simplified version that just gets active products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data as Product[] || [];
    } catch (error) {
      console.error("Error fetching popular products:", error);
      return [];
    }
  }
  
  /**
   * Get all product categories
   */
  async getProductCategories(activeOnly: boolean = true): Promise<ProductCategory[]> {
    try {
      let query = supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as ProductCategory[] || [];
    } catch (error) {
      console.error("Error fetching product categories:", error);
      return [];
    }
  }
  
  /**
   * Update inventory after a sale
   * This decreases product stock quantities
   */
  async updateInventoryFromSale(sale: Sale, items: SaleItem[]): Promise<boolean> {
    try {
      // For each item in the sale, reduce the stock quantity
      for (const item of items) {
        const { error } = await supabase.rpc('decrease_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        });
        
        if (error) throw error;
        
        // Remove from cache if exists
        this.productsCache.delete(item.product_id);
      }
      
      // Log the inventory transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(items.map(item => ({
          product_id: item.product_id,
          quantity: -item.quantity, // Negative for stock decrease
          operation_type: 'sale',
          reference_id: sale.id,
          reference_type: 'sale',
          notes: `Venda #${sale.id}`,
          operator_id: sale.operator_id
        })));
      
      if (transactionError) throw transactionError;
      
      return true;
    } catch (error) {
      console.error("Error updating inventory from sale:", error);
      return false;
    }
  }
  
  /**
   * Update inventory after a sale cancellation
   * This increases product stock quantities
   */
  async updateInventoryFromCancellation(sale: Sale, items: SaleItem[]): Promise<boolean> {
    try {
      // For each item in the sale, increase the stock quantity
      for (const item of items) {
        const { error } = await supabase.rpc('increase_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        });
        
        if (error) throw error;
        
        // Remove from cache if exists
        this.productsCache.delete(item.product_id);
      }
      
      // Log the inventory transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity, // Positive for stock increase
          operation_type: 'adjustment',
          reference_id: sale.id,
          reference_type: 'cancellation',
          notes: `Cancelamento Venda #${sale.id}`,
          operator_id: sale.operator_id
        })));
      
      if (transactionError) throw transactionError;
      
      return true;
    } catch (error) {
      console.error("Error updating inventory from cancellation:", error);
      return false;
    }
  }
  
  /**
   * Check if products have sufficient stock for a sale
   * Returns products that don't have enough stock
   */
  async checkStockAvailability(items: {product_id: string, quantity: number}[]): Promise<{product_id: string, name: string, available: number, requested: number}[]> {
    try {
      const insufficientStock = [];
      
      for (const item of items) {
        const product = await this.getProductById(item.product_id);
        
        if (!product) {
          insufficientStock.push({
            product_id: item.product_id,
            name: 'Produto não encontrado',
            available: 0,
            requested: item.quantity
          });
          continue;
        }
        
        if (product.stock_quantity < item.quantity) {
          insufficientStock.push({
            product_id: product.id,
            name: product.name,
            available: product.stock_quantity,
            requested: item.quantity
          });
        }
      }
      
      return insufficientStock;
    } catch (error) {
      console.error("Error checking stock availability:", error);
      return [];
    }
  }
  
  /**
   * Handle a manual stock adjustment
   */
  async adjustStock(
    productId: string, 
    quantity: number, 
    reason: string, 
    operatorId: string
  ): Promise<boolean> {
    try {
      // First get the current stock
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Calculate difference
      const difference = quantity - product.stock_quantity;
      const operation = difference >= 0 ? 'increase' : 'decrease';
      const absoluteDifference = Math.abs(difference);
      
      // Update the product stock
      if (operation === 'increase') {
        const { error } = await supabase.rpc('increase_product_stock', {
          product_id: productId,
          quantity: absoluteDifference
        });
        
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('decrease_product_stock', {
          product_id: productId,
          quantity: absoluteDifference
        });
        
        if (error) throw error;
      }
      
      // Record the transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
          product_id: productId,
          quantity: difference,
          operation_type: 'adjustment',
          notes: reason,
          operator_id: operatorId
        });
      
      if (transactionError) throw transactionError;
      
      // Remove from cache
      this.productsCache.delete(productId);
      
      return true;
    } catch (error) {
      console.error("Error adjusting stock:", error);
      return false;
    }
  }
  
  /**
   * Clear the products cache
   */
  clearCache(): void {
    this.productsCache.clear();
    this.lastCacheUpdate = 0;
  }
  
  /**
   * Get inventory alerts (low stock, out of stock)
   */
  async getInventoryAlerts(): Promise<{
    low_stock: Product[];
    out_of_stock: Product[];
  }> {
    try {
      // Get low stock products
      const { data: lowStock, error: lowStockError } = await supabase
        .from('products')
        .select('*')
        .gt('stock_quantity', 0)
        .lte('stock_quantity', supabase.raw('min_stock_quantity'))
        .eq('is_active', true)
        .limit(100);
      
      if (lowStockError) throw lowStockError;
      
      // Get out of stock products
      const { data: outOfStock, error: outOfStockError } = await supabase
        .from('products')
        .select('*')
        .eq('stock_quantity', 0)
        .eq('is_active', true)
        .limit(100);
      
      if (outOfStockError) throw outOfStockError;
      
      return {
        low_stock: lowStock as Product[] || [],
        out_of_stock: outOfStock as Product[] || []
      };
    } catch (error) {
      console.error("Error getting inventory alerts:", error);
      return { low_stock: [], out_of_stock: [] };
    }
  }
  
  /**
   * Generate stock replenishment order based on minimum stock levels
   */
  async generateReplenishmentOrder(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .lte('stock_quantity', supabase.raw('min_stock_quantity'))
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      
      return data as Product[] || [];
    } catch (error) {
      console.error("Error generating replenishment order:", error);
      return [];
    }
  }
}

// Create a singleton instance for use throughout the application
export const inventoryService = new InventoryService();
export default inventoryService;

// Type for product categories
interface ProductCategory {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
}