# Integração de Pagamentos no PDV/Checkout

Este documento detalha a implementação do sistema integrado de pagamentos no módulo de PDV (Ponto de Venda) e checkout do Controlaí.

## Arquitetura da Solução

A integração de pagamentos no PDV/Checkout é composta por:

1. **Página Unificada de Checkout**:
   - Interface intuitiva para gerenciamento de vendas e pagamentos
   - Fluxo completo desde a seleção de produtos até a emissão fiscal

2. **Componentes de Pagamento**:
   - `PaymentMethodSelector`: Seleção do método de pagamento
   - `PixPayment`, `CardPayment`, `CashPayment`, `VoucherPayment`: Interfaces específicas para cada método
   - `PaymentReceipt`: Geração de comprovantes
   - `SplitPayment`: Gerenciamento de pagamentos divididos
   - `PaymentSummary`: Resumo dos pagamentos realizados

3. **Serviços**:
   - `paymentService`: Processamento de pagamentos
   - `fiscalService`: Emissão de documentos fiscais
   - Integração com `CashierContext`: Gerenciamento de caixa

## Fluxo do Processo de Venda

A solução implementa um fluxo completo dividido em etapas:

### 1. Carrinho de Compras
- Adição de produtos via busca, código de barras, ou seleção
- Cálculo automático de subtotal, impostos e descontos
- Edição de quantidades e remoção de itens
- Adição de cliente e observações

### 2. Pagamento
- Seleção do método de pagamento (PIX, Cartão, Dinheiro, Vale)
- Processamento específico para cada método
- Suporte a pagamentos divididos em múltiplos métodos
- Validação em tempo real das transações
- Cálculo automático de troco para pagamentos em dinheiro

### 3. Comprovante
- Geração automática de comprovantes
- Opção de impressão em impressora térmica
- Envio por e-mail
- Detalhes completos da transação

### 4. Documento Fiscal
- Emissão integrada de documentos fiscais (NFC-e/NF-e)
- Validação e transmissão para a SEFAZ
- Impressão da DANFE

## Métodos de Pagamento Suportados

### PIX
- Geração de QR Code dinâmico
- Monitoramento automático de pagamentos
- Temporizador de expiração
- Opção de download e cópia da chave PIX

### Cartão de Crédito/Débito
- Integração com terminais TEF
- Parcelamento para cartões de crédito
- Suporte a múltiplas bandeiras
- Feedback visual do processo de autorização

### Dinheiro
- Cálculo automático de troco
- Botões de valores rápidos
- Calculadora integrada
- Comprovante detalhado com valores e troco

### Vale-Refeição/Alimentação
- Suporte a diferentes bandeiras (Alelo, VR, Sodexo, etc.)
- Diferenciação entre vale-refeição e vale-alimentação
- Integração com POS específicos para vales

## Pagamentos Divididos

A solução permite que uma venda seja paga utilizando diferentes métodos de pagamento simultaneamente:

1. Cliente seleciona o primeiro método e paga parte do valor
2. Sistema calcula o valor restante
3. Cliente seleciona outro método para o valor remanescente
4. Processo continua até o pagamento completo

Por exemplo:
- Venda de R$ 150,00 pode ser paga com R$ 100,00 em cartão de crédito e R$ 50,00 em dinheiro
- O sistema gera comprovantes para cada método utilizado

## Segurança e Conformidade

### Segurança
- Toda a comunicação com processadoras é feita via HTTPS
- Dados sensíveis não são armazenados localmente
- Validação em tempo real das transações
- Logs detalhados para auditoria

### Tratamento de Erros
- Timeout configurável para cada operação
- Retry automático em caso de falha de comunicação
- Feedback visual claro para o operador
- Opção de cancelamento e reinício da transação

## Integração com Fiscal

A integração com o módulo fiscal permite:

1. **Emissão Automatizada**:
   - NFC-e para consumidor final
   - NF-e para empresas/quando solicitado pelo cliente

2. **Fluxo Contínuo**:
   - A emissão fiscal ocorre após a confirmação do pagamento
   - A recusa na emissão fiscal não impede a finalização da venda
   - Documentos podem ser emitidos posteriormente se necessário

3. **Validação Prévia**:
   - Validação dos dados fiscais antes da transmissão
   - Tratamento de erros específicos de validação fiscal

## Adaptações e Personalização

O sistema pode ser adaptado para diferentes contextos:

- **Varejo Geral**: Utiliza NFC-e para a maioria das transações
- **Restaurantes**: Integração com comandas e divisão de contas
- **Serviços**: Emissão de NFS-e para notas de serviço

## Diagrama de Fluxo de Pagamento

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │     │              │
│   Carrinho   │────▶│  Pagamento   │────▶│ Comprovante  │────▶│  Documento   │
│              │     │              │     │              │     │    Fiscal    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
        │                   │                    │                    │
        ▼                   ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Adição de   │     │  Seleção de  │     │  Impressão   │     │   Emissão    │
│  Produtos    │     │   Método     │     │              │     │    NFC-e     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                             │                    │                    │
                             ▼                    ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │Processamento │     │   Envio por  │     │   Emissão    │
                     │              │     │    E-mail    │     │     NF-e     │
                     └──────────────┘     └──────────────┘     └──────────────┘
```

## Configuração Técnica

### Variáveis de Ambiente

```
// API de Pagamentos
VITE_PAYMENT_API_URL=https://api.example.com/v1
VITE_PAYMENT_API_KEY=your-api-key
VITE_PAYMENT_SECRET_KEY=your-secret-key
VITE_PAYMENT_MERCHANT_ID=your-merchant-id
VITE_PAYMENT_ENVIRONMENT=production|sandbox

// API Fiscal
VITE_FISCAL_API_URL=https://api.fiscal.example.com/v1  
VITE_FISCAL_API_KEY=your-fiscal-api-key
VITE_FISCAL_COMPANY_ID=your-company-id
VITE_FISCAL_TEST_MODE=false|true
```

### Dependências

- qrcode.react: Geração de QR Codes para PIX
- react-to-print: Impressão de comprovantes
- axios: Comunicação com APIs externas
- react-toastify: Notificações ao usuário

## Considerações para Ambientes de Produção

1. **Performance**:
   - Cache local para produtos frequentemente vendidos
   - Otimização de componentes que renderizam listas grandes
   - Priorização de APIs críticas (pagamento e fiscal)

2. **Segurança**:
   - Implementação de rate limiting para APIs de pagamento
   - Validação rigorosa de dados de entrada
   - Verificações de segurança em atualizações de biblioteca

3. **Tolerância a Falhas**:
   - Modo offline para operações essenciais
   - Armazenamento local de transações pendentes
   - Sincronização automática quando conexão for restaurada

## Testes e Homologação

Antes de usar em produção, é essencial realizar:

1. Testes com processadoras reais em ambiente de sandbox
2. Homologação fiscal com a SEFAZ estadual
3. Testes de integração com impressoras fiscais e não-fiscais
4. Validação do fluxo completo com cenários complexos:
   - Pagamentos parciais
   - Cancelamentos
   - Estornos
   - Contingência fiscal

## Conclusão

A integração de pagamentos no PDV/Checkout oferece uma solução completa e flexível para processamento de pagamentos, com interface intuitiva para operadores, suporte a múltiplos métodos de pagamento, e conformidade com requisitos fiscais brasileiros.

A arquitetura modular permite fácil extensão para novos métodos de pagamento e adaptação para diferentes segmentos comerciais.