import { SalesReportParams, SalesDashboardData, SalesMetric, SalesAlertConfig } from '../types/api';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Serviço para análise de dados de vendas
 */
export class SalesAnalyticsService {
  private apiUrl: string;
  private apiKey: string;
  
  constructor() {
    this.apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';
    this.apiKey = import.meta.env.VITE_ANALYTICS_API_KEY || '';
  }
  
  /**
   * Obtém dados do dashboard de vendas
   * 
   * @param period 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year'
   * @returns Dados do dashboard
   */
  async getDashboardData(period: string = 'today'): Promise<SalesDashboardData> {
    try {
      // Determinar intervalo de datas com base no período
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Obter métricas de vendas
      const metrics = await this.getSalesMetrics(startDate, endDate);
      
      // Obter dados de gráficos
      const charts = await this.getSalesCharts(startDate, endDate);
      
      // Obter produtos mais vendidos
      const topProducts = await this.getTopProducts(startDate, endDate);
      
      // Obter clientes mais importantes
      const topCustomers = await this.getTopCustomers(startDate, endDate);
      
      // Obter vendas recentes
      const recentSales = await this.getRecentSales();
      
      return {
        metrics,
        charts,
        topProducts,
        topCustomers,
        recentSales
      };
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      throw new Error('Falha ao carregar dados do dashboard de vendas');
    }
  }
  
  /**
   * Gera um relatório de vendas com base nos parâmetros especificados
   * 
   * @param params Parâmetros do relatório
   * @returns URL do relatório gerado
   */
  async generateSalesReport(params: SalesReportParams): Promise<string> {
    try {
      // Em uma implementação real, enviaríamos esses parâmetros para a API
      console.log('Gerando relatório com parâmetros:', params);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Retornar URL fictícia do relatório
      return `https://example.com/reports/${Date.now()}.pdf`;
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      throw new Error('Falha ao gerar relatório de vendas');
    }
  }
  
  /**
   * Configura um novo alerta para métricas de vendas
   * 
   * @param config Configuração do alerta
   * @returns ID do alerta criado
   */
  async configureAlert(config: Omit<SalesAlertConfig, 'id'>): Promise<string> {
    try {
      // Em uma implementação real, enviaríamos essa configuração para a API
      console.log('Configurando alerta:', config);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Retornar ID fictício do alerta
      return `alert_${Date.now()}`;
    } catch (error) {
      console.error('Erro ao configurar alerta:', error);
      throw new Error('Falha ao configurar alerta de vendas');
    }
  }
  
  /**
   * Obtém todas as configurações de alertas
   * 
   * @returns Lista de configurações de alertas
   */
  async getAlertConfigurations(): Promise<SalesAlertConfig[]> {
    try {
      // Em uma implementação real, buscaríamos da API ou banco de dados
      // Aqui retornamos dados de exemplo
      return [
        {
          id: 'alert_1',
          metricId: 'daily_sales',
          condition: 'lt',
          value: 1000,
          channels: ['email', 'system'],
          recipients: ['admin@example.com'],
          active: true,
          message: 'Alerta: Vendas diárias abaixo de R$ 1.000,00'
        },
        {
          id: 'alert_2',
          metricId: 'stock_level',
          condition: 'lte',
          value: 10,
          channels: ['email', 'sms', 'system'],
          recipients: ['admin@example.com', 'stockmanager@example.com'],
          active: true,
          message: 'Alerta: Produtos com estoque crítico (10 unidades ou menos)'
        }
      ];
    } catch (error) {
      console.error('Erro ao obter configurações de alertas:', error);
      throw new Error('Falha ao carregar configurações de alertas');
    }
  }
  
  /**
   * Importa dados de vendas de um arquivo CSV/Excel
   * 
   * @param file Arquivo a ser importado
   * @returns Número de registros importados
   */
  async importSalesData(file: File): Promise<number> {
    try {
      // Em uma implementação real, enviaríamos o arquivo para processamento
      console.log('Importando dados do arquivo:', file.name);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retornar número fictício de registros importados
      return Math.floor(Math.random() * 100) + 50;
    } catch (error) {
      console.error('Erro ao importar dados de vendas:', error);
      throw new Error('Falha ao importar dados de vendas');
    }
  }
  
  /**
   * Exporta dados de vendas para CSV/Excel
   * 
   * @param params Parâmetros do relatório
   * @param format 'csv' | 'excel' | 'pdf'
   * @returns Blob do arquivo para download
   */
  async exportSalesData(params: SalesReportParams, format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    try {
      // Em uma implementação real, solicitaríamos a exportação à API
      console.log(`Exportando dados no formato ${format} com parâmetros:`, params);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Retornar um blob vazio (em uma implementação real, seria o arquivo)
      return new Blob(['Dados de exemplo'], { type: format === 'csv' ? 'text/csv' : 'application/octet-stream' });
    } catch (error) {
      console.error('Erro ao exportar dados de vendas:', error);
      throw new Error('Falha ao exportar dados de vendas');
    }
  }
  
  // Métodos auxiliares
  
  /**
   * Calcula o intervalo de datas com base no período selecionado
   */
  private getDateRangeForPeriod(period: string): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);
    
    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfDay(subDays(now, 90));
        break;
      case 'year':
        startDate = startOfDay(subDays(now, 365));
        break;
      default:
        startDate = startOfDay(now); // Padrão: hoje
    }
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  }
  
  /**
   * Obtém métricas de vendas do banco de dados
   */
  private async getSalesMetrics(startDate: string, endDate: string): Promise<SalesMetric[]> {
    try {
      // Em uma implementação real, buscaríamos do banco de dados via Supabase
      // Aqui retornamos dados de exemplo para demonstração
      return [
        {
          id: 'total_sales',
          name: 'Vendas Totais',
          value: 12580.75,
          unit: 'BRL',
          trend: 8.5,
          status: 'success',
          period: `${startDate} a ${endDate}`
        },
        {
          id: 'avg_ticket',
          name: 'Ticket Médio',
          value: 87.32,
          unit: 'BRL',
          trend: 1.2,
          status: 'info',
          period: `${startDate} a ${endDate}`
        },
        {
          id: 'total_customers',
          name: 'Clientes Atendidos',
          value: 144,
          unit: 'clientes',
          trend: 5.8,
          status: 'success',
          period: `${startDate} a ${endDate}`
        },
        {
          id: 'conversion_rate',
          name: 'Taxa de Conversão',
          value: 68.5,
          unit: '%',
          trend: -2.1,
          status: 'warning',
          period: `${startDate} a ${endDate}`
        }
      ];
    } catch (error) {
      console.error('Erro ao obter métricas de vendas:', error);
      throw new Error('Falha ao carregar métricas de vendas');
    }
  }
  
  /**
   * Obtém dados para gráficos de vendas
   */
  private async getSalesCharts(startDate: string, endDate: string): Promise<any[]> {
    try {
      // Em uma implementação real, buscaríamos do banco de dados
      // Retornando dados de exemplo para demonstração
      
      // Dados de exemplo para gráfico de vendas por dia
      const salesByDay = {
        id: 'sales_by_day',
        type: 'line',
        title: 'Vendas por Dia',
        data: Array.from({ length: 15 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - 14 + i);
          return {
            date: format(date, 'dd/MM'),
            value: Math.floor(Math.random() * 2000) + 1000
          };
        })
      };
      
      // Dados de exemplo para gráfico de vendas por categoria
      const salesByCategory = {
        id: 'sales_by_category',
        type: 'pie',
        title: 'Vendas por Categoria',
        data: [
          { name: 'Pães', value: 35 },
          { name: 'Bolos', value: 20 },
          { name: 'Bebidas', value: 15 },
          { name: 'Salgados', value: 18 },
          { name: 'Doces', value: 12 }
        ]
      };
      
      // Dados de exemplo para gráfico de vendas por método de pagamento
      const salesByPaymentMethod = {
        id: 'sales_by_payment',
        type: 'bar',
        title: 'Vendas por Método de Pagamento',
        data: [
          { name: 'Cartão de Crédito', value: 6580.25 },
          { name: 'Dinheiro', value: 2340.50 },
          { name: 'PIX', value: 3450.80 },
          { name: 'Cartão de Débito', value: 1780.45 }
        ]
      };
      
      return [salesByDay, salesByCategory, salesByPaymentMethod];
    } catch (error) {
      console.error('Erro ao obter dados para gráficos:', error);
      throw new Error('Falha ao carregar dados para gráficos de vendas');
    }
  }
  
  /**
   * Obtém os produtos mais vendidos no período
   */
  private async getTopProducts(startDate: string, endDate: string): Promise<any[]> {
    try {
      // Em uma implementação real, buscaríamos do banco de dados
      // Retornando dados de exemplo
      return [
        { id: 'prod1', name: 'Pão Francês', quantity: 1250, total: 937.50, percentage: 15.8 },
        { id: 'prod2', name: 'Café', quantity: 820, total: 2460.00, percentage: 10.5 },
        { id: 'prod3', name: 'Pão de Queijo', quantity: 650, total: 2275.00, percentage: 8.3 },
        { id: 'prod4', name: 'Sonho', quantity: 450, total: 2025.00, percentage: 5.7 },
        { id: 'prod5', name: 'Bolo de Chocolate', quantity: 320, total: 1600.00, percentage: 4.1 }
      ];
    } catch (error) {
      console.error('Erro ao obter produtos mais vendidos:', error);
      throw new Error('Falha ao carregar dados de produtos mais vendidos');
    }
  }
  
  /**
   * Obtém os clientes mais importantes no período
   */
  private async getTopCustomers(startDate: string, endDate: string): Promise<any[]> {
    try {
      // Em uma implementação real, buscaríamos do banco de dados
      // Retornando dados de exemplo
      return [
        { id: 'cust1', name: 'João Silva', purchases: 12, total: 980.50, lastPurchase: '15/05/2025' },
        { id: 'cust2', name: 'Maria Oliveira', purchases: 8, total: 780.25, lastPurchase: '14/05/2025' },
        { id: 'cust3', name: 'Carlos Santos', purchases: 6, total: 620.80, lastPurchase: '10/05/2025' },
        { id: 'cust4', name: 'Ana Costa', purchases: 5, total: 540.35, lastPurchase: '12/05/2025' },
        { id: 'cust5', name: 'Paulo Mendes', purchases: 4, total: 450.90, lastPurchase: '09/05/2025' }
      ];
    } catch (error) {
      console.error('Erro ao obter clientes mais importantes:', error);
      throw new Error('Falha ao carregar dados de clientes mais importantes');
    }
  }
  
  /**
   * Obtém as vendas mais recentes
   */
  private async getRecentSales(): Promise<any[]> {
    try {
      // Em uma implementação real, buscaríamos do banco de dados
      // Retornando dados de exemplo
      return [
        { id: 'sale1', date: '15/05/2025 14:30', customer: 'João Silva', total: 78.50, items: 5, status: 'completed' },
        { id: 'sale2', date: '15/05/2025 13:45', customer: 'Maria Oliveira', total: 125.25, items: 8, status: 'completed' },
        { id: 'sale3', date: '15/05/2025 11:20', customer: 'Carlos Santos', total: 45.80, items: 3, status: 'completed' },
        { id: 'sale4', date: '15/05/2025 10:15', customer: 'Ana Costa', total: 92.35, items: 6, status: 'completed' },
        { id: 'sale5', date: '14/05/2025 16:50', customer: 'Paulo Mendes', total: 65.90, items: 4, status: 'completed' }
      ];
    } catch (error) {
      console.error('Erro ao obter vendas recentes:', error);
      throw new Error('Falha ao carregar dados de vendas recentes');
    }
  }
}

// Exportar uma instância singleton
export const salesAnalyticsService = new SalesAnalyticsService();
export default salesAnalyticsService;