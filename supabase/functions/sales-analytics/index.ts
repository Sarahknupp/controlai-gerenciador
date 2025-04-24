// Supabase Edge Function: Sales Analytics API
// Fornece endpoints para análise de dados de vendas em tempo real

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

// Configuração de CORS para permitir solicitações da origem do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey, X-Client-Info',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Mapa de períodos para consultas SQL
const PERIOD_MAPPING: Record<string, string> = {
  'today': 'CURRENT_DATE',
  'yesterday': 'CURRENT_DATE - INTERVAL \'1 day\'',
  'week': 'CURRENT_DATE - INTERVAL \'7 days\'',
  'month': 'CURRENT_DATE - INTERVAL \'30 days\'',
  'quarter': 'CURRENT_DATE - INTERVAL \'90 days\'',
  'year': 'CURRENT_DATE - INTERVAL \'365 days\'',
};

// Lida com solicitações baseadas no method e path
const handleRequest = async (method: string, path: string[], req: Request): Promise<Response> => {
  // Obter o cliente Supabase usando as credenciais de serviço
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // Extrai o token JWT do header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Faltando token de autorização' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verifica o token JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Implementação das rotas
    if (method === 'GET') {
      // GET /sales-analytics/dashboard?period=month
      if (path.length === 1 && path[0] === 'dashboard') {
        const url = new URL(req.url);
        const period = url.searchParams.get('period') || 'month';
        
        return await getDashboardData(supabaseClient, period);
      }
      
      // GET /sales-analytics/reports?startDate=2025-01-01&endDate=2025-12-31
      if (path.length === 1 && path[0] === 'reports') {
        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const groupBy = url.searchParams.get('groupBy') || 'day';
        
        if (!startDate || !endDate) {
          return new Response(
            JSON.stringify({ error: 'Parâmetros startDate e endDate são obrigatórios' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await getSalesReport(supabaseClient, startDate, endDate, groupBy as any);
      }
      
      // GET /sales-analytics/alerts
      if (path.length === 1 && path[0] === 'alerts') {
        return await getAlertConfigurations(supabaseClient);
      }
      
      // GET /sales-analytics/metrics?period=month
      if (path.length === 1 && path[0] === 'metrics') {
        const url = new URL(req.url);
        const period = url.searchParams.get('period') || 'month';
        
        return await getSalesMetrics(supabaseClient, period);
      }
    } else if (method === 'POST') {
      // POST /sales-analytics/reports/generate
      if (path.length === 2 && path[0] === 'reports' && path[1] === 'generate') {
        const body = await req.json();
        
        if (!body.startDate || !body.endDate) {
          return new Response(
            JSON.stringify({ error: 'Parâmetros startDate e endDate são obrigatórios' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await generateSalesReport(supabaseClient, body);
      }
      
      // POST /sales-analytics/alerts
      if (path.length === 1 && path[0] === 'alerts') {
        const body = await req.json();
        
        if (!body.metricId || !body.condition || body.value === undefined) {
          return new Response(
            JSON.stringify({ error: 'Configuração de alerta inválida' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        return await createAlertConfiguration(supabaseClient, body, user.id);
      }
    } else if (method === 'DELETE') {
      // DELETE /sales-analytics/alerts/:id
      if (path.length === 2 && path[0] === 'alerts') {
        const alertId = path[1];
        
        return await deleteAlertConfiguration(supabaseClient, alertId);
      }
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro na API de Analytics:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Implementações das funções da API

// Obtém dados do dashboard
async function getDashboardData(supabase, period: string): Promise<Response> {
  try {
    const periodValue = PERIOD_MAPPING[period] || PERIOD_MAPPING['month'];

    // Em produção, essas consultas seriam otimizadas e usariam views ou funções RPC
    
    // Consulta total de vendas no período
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total, sale_date')
      .gte('sale_date', `${periodValue}`)
      .eq('status', 'completed');

    if (salesError) throw salesError;
    
    // Calcula métricas
    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const totalCount = salesData.length;
    const avgTicket = totalSales / (totalCount || 1);
    
    // Calcular vendas por dia (para gráfico)
    const salesByDay = {};
    salesData.forEach(sale => {
      const date = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = 0;
      }
      salesByDay[date] += sale.total;
    });
    
    // Converter para formato adequado para gráficos
    const salesByDayChart = Object.entries(salesByDay).map(([date, total]) => ({
      date,
      total
    }));
    
    // Montar resposta
    const response = {
      metrics: [
        {
          id: 'total_sales',
          name: 'Vendas Totais',
          value: totalSales,
          unit: 'BRL',
          status: 'success',
          period: period
        },
        {
          id: 'average_ticket',
          name: 'Ticket Médio',
          value: avgTicket,
          unit: 'BRL',
          status: 'info',
          period: period
        },
        {
          id: 'sales_count',
          name: 'Número de Vendas',
          value: totalCount,
          unit: 'vendas',
          status: 'info',
          period: period
        }
      ],
      charts: [
        {
          id: 'sales_by_day',
          type: 'line',
          title: 'Vendas por Dia',
          data: salesByDayChart
        }
      ]
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar dados do dashboard', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém relatório de vendas por período
async function getSalesReport(supabase, startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<Response> {
  try {
    // Em uma implementação real, usaríamos funções SQL para agrupar resultados
    // Por simplicidade, vamos simular com um retorno básico
    
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        total,
        sale_date,
        status,
        customer_id,
        customers(name)
      `)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .eq('status', 'completed');
      
    if (salesError) throw salesError;
    
    return new Response(
      JSON.stringify({
        startDate,
        endDate,
        groupBy,
        totalSales: salesData.length,
        totalAmount: salesData.reduce((sum, sale) => sum + sale.total, 0),
        data: salesData.map(sale => ({
          id: sale.id,
          date: sale.sale_date,
          customer: sale.customers?.name || 'Cliente não identificado',
          total: sale.total
        }))
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar relatório de vendas', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém configurações de alertas
async function getAlertConfigurations(supabase): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('sales_alerts')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao obter configurações de alertas:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar configurações de alertas', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Obtém métricas de vendas
async function getSalesMetrics(supabase, period: string): Promise<Response> {
  try {
    const periodValue = PERIOD_MAPPING[period] || PERIOD_MAPPING['month'];
    
    // Execute query to get sales metrics
    const { data, error } = await supabase.rpc('get_sales_metrics', {
      period_start: periodValue
    });
      
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data || []),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao obter métricas de vendas:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar métricas de vendas', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Gera um relatório de vendas
async function generateSalesReport(supabase, params): Promise<Response> {
  try {
    // Em uma implementação real, iniciaríamos um job de geração de relatório
    // e retornaríamos um identificador para consulta posterior
    
    return new Response(
      JSON.stringify({
        reportId: `report_${Date.now()}`,
        status: 'generating',
        params
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar relatório', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Cria uma configuração de alerta
async function createAlertConfiguration(supabase, config, userId: string): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('sales_alerts')
      .insert({
        ...config,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao criar configuração de alerta:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao criar configuração de alerta', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Exclui uma configuração de alerta
async function deleteAlertConfiguration(supabase, alertId: string): Promise<Response> {
  try {
    const { error } = await supabase
      .from('sales_alerts')
      .delete()
      .eq('id', alertId);
      
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ success: true, message: 'Configuração de alerta excluída com sucesso' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao excluir configuração de alerta:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao excluir configuração de alerta', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Handler principal da EdgeFunction
serve(async (req) => {
  // Lidar com solicitações OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse da URL para extrair o path
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Remover 'sales-analytics' do início do path, se presente
    if (path.length > 0 && path[0] === 'sales-analytics') {
      path.shift();
    }
    
    // Delegar para o handler apropriado
    return await handleRequest(req.method, path, req);
    
  } catch (error) {
    console.error('Erro na API de analytics:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
      { status: a500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});