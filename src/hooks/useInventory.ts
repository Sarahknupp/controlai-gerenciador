import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  expectedQuantity: number;
  actualQuantity: number;
  unit: string;
  costPrice: number;
  totalValue: number;
  lastChecked: string;
  movementHistory: {
    date: string;
    type: string;
    quantity: number;
    by: string;
    note: string;
  }[];
  status: string;
}

export interface InventoryCount {
  id: string;
  startDate: string;
  endDate: string | null;
  status: 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
  items: {
    productId: string;
    expectedQty: number;
    actualQty: number;
    difference: number;
  }[];
}

export function useInventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [currentCount, setCurrentCount] = useState<InventoryCount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch inventory items from database
  const fetchInventoryItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from Supabase
      // const { data, error } = await supabase
      //   .from('inventory_items')
      //   .select(`
      //     id, 
      //     products(name, sku, category_id, unit), 
      //     quantity,
      //     minimum_quantity,
      //     location,
      //     last_checked
      //   `);
      
      // if (error) throw error;
      
      // For demo purposes, we'll use mock data
      const mockItems: InventoryItem[] = [
        {
          id: 1,
          name: 'Farinha de Trigo',
          sku: 'MTRE001',
          category: 'Ingredientes',
          supplier: 'Distribuidora de Farinhas ABC',
          expectedQuantity: 75,
          actualQuantity: 75,
          unit: 'kg',
          costPrice: 3.20,
          totalValue: 240.00,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '10/05/2025', type: 'entry', quantity: 25, by: 'João Silva', note: 'Recebimento de fornecedor' },
            { date: '11/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Produção de pão francês' },
            { date: '13/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Produção de pão italiano' }
          ],
          status: 'normal'
        },
        {
          id: 2,
          name: 'Açúcar Refinado',
          sku: 'ACUC001',
          category: 'Ingredientes',
          supplier: 'Açúcar & Adoçantes Ltda',
          expectedQuantity: 50,
          actualQuantity: 42,
          unit: 'kg',
          costPrice: 4.90,
          totalValue: 205.80,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '05/05/2025', type: 'entry', quantity: 50, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
            { date: '08/05/2025', type: 'exit', quantity: 5, by: 'Sistema', note: 'Produção de bolos' },
            { date: '12/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Produção de doces' }
          ],
          status: 'discrepancy'
        },
        {
          id: 3,
          name: 'Leite Integral',
          sku: 'LEIT001',
          category: 'Ingredientes',
          supplier: 'Laticínios do Vale',
          expectedQuantity: 30,
          actualQuantity: 28,
          unit: 'L',
          costPrice: 4.50,
          totalValue: 126.00,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '08/05/2025', type: 'entry', quantity: 30, by: 'João Silva', note: 'Recebimento de fornecedor' },
            { date: '10/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Produção de pão de leite' }
          ],
          status: 'normal'
        },
        {
          id: 4,
          name: 'Refrigerante Cola',
          sku: 'REFR001',
          category: 'Bebidas',
          supplier: 'Bebidas Express',
          expectedQuantity: 48,
          actualQuantity: 45,
          unit: 'un',
          costPrice: 6.50,
          totalValue: 292.50,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '12/05/2025', type: 'entry', quantity: 48, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
            { date: '14/05/2025', type: 'exit', quantity: 3, by: 'Sistema', note: 'Vendas via PDV' }
          ],
          status: 'normal'
        },
        {
          id: 5,
          name: 'Água Mineral',
          sku: 'AGUA001',
          category: 'Bebidas',
          supplier: 'Bebidas Express',
          expectedQuantity: 36,
          actualQuantity: 30,
          unit: 'un',
          costPrice: 1.85,
          totalValue: 55.50,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '12/05/2025', type: 'entry', quantity: 36, by: 'Maria Oliveira', note: 'Recebimento de fornecedor' },
            { date: '13/05/2025', type: 'exit', quantity: 4, by: 'Sistema', note: 'Vendas via PDV' },
            { date: '14/05/2025', type: 'exit', quantity: 2, by: 'Sistema', note: 'Vendas via PDV' }
          ],
          status: 'discrepancy'
        },
        {
          id: 6,
          name: 'Chocolate em Pó',
          sku: 'CHOC001',
          category: 'Ingredientes',
          supplier: 'Distribuidora de Alimentos XYZ',
          expectedQuantity: 15,
          actualQuantity: 12,
          unit: 'kg',
          costPrice: 18.90,
          totalValue: 226.80,
          lastChecked: '15/05/2025',
          movementHistory: [
            { date: '01/05/2025', type: 'entry', quantity: 15, by: 'João Silva', note: 'Recebimento de fornecedor' },
            { date: '07/05/2025', type: 'exit', quantity: 1.5, by: 'Sistema', note: 'Produção de bolos' },
            { date: '10/05/2025', type: 'exit', quantity: 1.5, by: 'Sistema', note: 'Produção de bolos' }
          ],
          status: 'normal'
        }
      ];
      
      setInventoryItems(mockItems);
    } catch (err) {
      setError('Erro ao carregar itens do inventário');
      console.error('Error fetching inventory items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new inventory count
  const startInventoryCount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would create a record in Supabase
      // const { data, error } = await supabase
      //   .from('inventory_counts')
      //   .insert({
      //     start_date: new Date(),
      //     status: 'ongoing',
      //     created_by: user.id
      //   })
      //   .select()
      //   .single();
      
      // if (error) throw error;
      
      // For demo purposes, we'll create a mock count
      const newCount: InventoryCount = {
        id: Math.random().toString(36).substring(2, 9),
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'ongoing',
        createdBy: 'current-user',
        items: []
      };
      
      setCurrentCount(newCount);
      
      alert('Contagem de inventário iniciada com sucesso!');
      
      return newCount;
    } catch (err) {
      setError('Erro ao iniciar contagem de inventário');
      console.error('Error starting inventory count:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update actual quantity for an item
  const updateItemQuantity = async (itemId: number, actualQuantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would update a record in Supabase
      // const { error } = await supabase
      //   .from('inventory_items')
      //   .update({ quantity: actualQuantity })
      //   .eq('id', itemId);
      
      // if (error) throw error;
      
      // For demo purposes, we'll update the mock data
      setInventoryItems(currentItems => 
        currentItems.map(item => 
          item.id === itemId 
            ? { ...item, actualQuantity, status: item.expectedQuantity !== actualQuantity ? 'discrepancy' : 'normal' } 
            : item
        )
      );
      
      return true;
    } catch (err) {
      setError('Erro ao atualizar quantidade do item');
      console.error('Error updating item quantity:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reconcile inventory quantities
  const reconcileInventory = async (itemId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find the item
      const item = inventoryItems.find(item => item.id === itemId);
      if (!item) throw new Error('Item não encontrado');
      
      // In a real app, this would update records in Supabase
      // const { error } = await supabase
      //   .from('inventory_items')
      //   .update({ 
      //     expected_quantity: item.actualQuantity,
      //     last_checked: new Date().toISOString()
      //   })
      //   .eq('id', itemId);
      
      // if (error) throw error;
      
      // For demo purposes, we'll update the mock data
      setInventoryItems(currentItems => 
        currentItems.map(i => 
          i.id === itemId 
            ? { 
                ...i, 
                expectedQuantity: i.actualQuantity,
                status: 'normal',
                lastChecked: new Date().toLocaleDateString('pt-BR'),
                movementHistory: [
                  {
                    date: new Date().toLocaleDateString('pt-BR'),
                    type: 'adjustment',
                    quantity: i.actualQuantity - i.expectedQuantity,
                    by: 'Usuário atual',
                    note: 'Reconciliação de inventário'
                  },
                  ...i.movementHistory
                ]
              } 
            : i
        )
      );
      
      alert('Inventário reconciliado com sucesso!');
      return true;
    } catch (err) {
      setError('Erro ao reconciliar inventário');
      console.error('Error reconciling inventory:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust inventory
  const adjustInventory = async (itemId: number, newQuantity: number, reason: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find the item
      const item = inventoryItems.find(item => item.id === itemId);
      if (!item) throw new Error('Item não encontrado');
      
      // In a real app, this would update records in Supabase and add transaction history
      // const { error: updateError } = await supabase
      //   .from('inventory_items')
      //   .update({ 
      //     quantity: newQuantity,
      //     expected_quantity: newQuantity,
      //     last_checked: new Date().toISOString()
      //   })
      //   .eq('id', itemId);
      
      // if (updateError) throw updateError;
      
      // // Add transaction record
      // const { error: transactionError } = await supabase
      //   .from('inventory_transactions')
      //   .insert({
      //     product_id: item.productId,
      //     operation_type: 'adjustment',
      //     quantity: newQuantity - item.actualQuantity,
      //     notes: reason,
      //   });
      
      // if (transactionError) throw transactionError;
      
      // For demo purposes, we'll update the mock data
      const quantityDiff = newQuantity - item.actualQuantity;
      
      setInventoryItems(currentItems => 
        currentItems.map(i => 
          i.id === itemId 
            ? { 
                ...i, 
                expectedQuantity: newQuantity,
                actualQuantity: newQuantity,
                status: 'normal',
                lastChecked: new Date().toLocaleDateString('pt-BR'),
                totalValue: newQuantity * i.costPrice,
                movementHistory: [
                  {
                    date: new Date().toLocaleDateString('pt-BR'),
                    type: 'adjustment',
                    quantity: quantityDiff,
                    by: 'Usuário atual',
                    note: reason
                  },
                  ...i.movementHistory
                ]
              } 
            : i
        )
      );
      
      alert('Estoque ajustado com sucesso!');
      return true;
    } catch (err) {
      setError('Erro ao ajustar estoque');
      console.error('Error adjusting inventory:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate inventory template for download
  const generateInventoryTemplate = () => {
    try {
      // This would normally generate a CSV or Excel file
      const templateData = inventoryItems.map(item => ({
        sku: item.sku,
        name: item.name,
        expected_quantity: item.expectedQuantity,
        actual_quantity: '',
        unit: item.unit,
        notes: ''
      }));
      
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventário');
      
      // Add headers
      XLSX.utils.sheet_add_aoa(worksheet, [
        ['SKU', 'Nome do Produto', 'Quantidade Esperada', 'Quantidade Real', 'Unidade', 'Observações']
      ], { origin: 'A1' });
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(data, 'modelo_contagem_estoque.xlsx');
      
      return true;
    } catch (err) {
      console.error('Error generating template:', err);
      alert('Erro ao gerar modelo de contagem');
      return false;
    }
  };

  // Import inventory from file
  const importInventory = async (fileContent: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Parse CSV content
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      
      // Skip header row
      const rows = lines.slice(1).filter(line => line.trim() !== '');
      
      if (rows.length === 0) {
        throw new Error('Arquivo vazio ou inválido');
      }
      
      // Process each row
      const updates = rows.map(row => {
        const columns = row.split(',');
        const sku = columns[0].trim();
        const actualQty = parseFloat(columns[3].trim());
        
        if (isNaN(actualQty)) {
          throw new Error(`Quantidade inválida para o produto ${sku}`);
        }
        
        return { sku, actualQty };
      });
      
      // Apply updates to items
      let updatedCount = 0;
      
      for (const update of updates) {
        const itemIndex = inventoryItems.findIndex(item => item.sku === update.sku);
        if (itemIndex >= 0) {
          await updateItemQuantity(inventoryItems[itemIndex].id, update.actualQty);
          updatedCount++;
        }
      }
      
      alert(`Importação concluída. ${updatedCount} itens atualizados.`);
      return updatedCount;
    } catch (err) {
      setError('Erro ao importar inventário');
      console.error('Error importing inventory:', err);
      alert(`Erro ao importar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate inventory report
  const generateReport = () => {
    try {
      // Create PDF report
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Relatório de Inventário', 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
      
      // Prepare table data
      const tableColumn = [
        'SKU', 'Produto', 'Quantidade', 'Qtd Min', 'Custo Un.', 'Valor Total', 'Status'
      ];
      const tableRows = inventoryItems.map(item => [
        item.sku,
        item.name,
        `${item.actualQuantity} ${item.unit}`,
        `${item.expectedQuantity} ${item.unit}`,
        `R$ ${item.costPrice.toFixed(2)}`,
        `R$ ${item.totalValue.toFixed(2)}`,
        item.status === 'normal' ? 'Correto' : 
        item.status === 'discrepancy' ? 'Divergente' : item.status
      ]);
      
      // Add summary row
      const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Add table
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY || 30;
      doc.text(`Valor Total do Inventário: R$ ${totalValue.toFixed(2)}`, 14, finalY + 10);
      doc.text(`Total de Itens: ${inventoryItems.length}`, 14, finalY + 16);
      doc.text(`Itens com Divergência: ${inventoryItems.filter(i => i.status === 'discrepancy').length}`, 14, finalY + 22);
      
      // Save the PDF
      doc.save('relatorio_inventario.pdf');
      
      return true;
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Erro ao gerar relatório');
      return false;
    }
  };

  // Initialize by fetching items
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  return {
    inventoryItems,
    currentCount,
    isLoading,
    error,
    fetchInventoryItems,
    startInventoryCount,
    updateItemQuantity,
    reconcileInventory,
    adjustInventory,
    generateInventoryTemplate,
    importInventory,
    generateReport
  };
}