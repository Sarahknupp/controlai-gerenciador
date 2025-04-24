# Documentação da Integração de Pagamentos

Esta documentação descreve a implementação do sistema de pagamento integrado desenvolvido para o Controlaí.

## Arquitetura da Solução

A solução é composta pelos seguintes componentes:

1. **Tipos e Interfaces**:
   - Definidos em `src/types/payment.ts`
   - Descrevem as estruturas de dados para transações e métodos de pagamento

2. **Serviço de Pagamento**:
   - `PaymentService` em `src/services/paymentService.ts`
   - Responsável pela comunicação com processadores de pagamento
   - Gerencia todo o ciclo de vida das transações

3. **Componentes de UI**:
   - `PaymentProcessor`: Componente principal que orquestra o fluxo de pagamento
   - `PaymentMethodSelector`: Seleção do método de pagamento
   - `PixPayment`: Interface para pagamento via PIX com QR code
   - `CardPayment`: Interface para pagamento com cartão (TEF)
   - `CashPayment`: Interface para pagamento em dinheiro com cálculo de troco
   - `PaymentReceipt`: Comprovante de pagamento

## Métodos de Pagamento Suportados

### 1. PIX

- **Funcionalidades**:
  - Geração de QR Code dinâmico
  - Copiar e colar chave PIX
  - Monitoramento de status de pagamento em tempo real
  - Notificações quando o pagamento é recebido
  - Expiração automática do código (30 minutos por padrão)

- **Fluxo de Pagamento**:
  1. Sistema gera QR Code e chave PIX
  2. Cliente escaneia com seu aplicativo bancário
  3. Sistema monitora o status da transação
  4. Ao receber confirmação, a venda é concluída

### 2. Cartão (TEF)

- **Funcionalidades**:
  - Suporte a cartões de crédito e débito
  - Comunicação com terminal de pagamento
  - Parcelamento para compras com cartão de crédito
  - Autenticação em duas etapas para maior segurança
  - Suporte a múltiplas bandeiras (Visa, Mastercard, Elo, etc.)

- **Fluxo de Pagamento**:
  1. Operador seleciona tipo de cartão e número de parcelas
  2. Sistema se comunica com o terminal TEF
  3. Cliente insere ou aproxima o cartão no terminal
  4. Terminal processa a transação com a adquirente
  5. Sistema recebe confirmação e finaliza a venda

### 3. Dinheiro

- **Funcionalidades**:
  - Cálculo automático de troco
  - Valores rápidos para facilitar a operação
  - Calculadora integrada
  - Geração de comprovante digital

- **Fluxo de Pagamento**:
  1. Operador insere valor recebido
  2. Sistema calcula o troco automaticamente
  3. Transação é registrada
  4. Comprovante é gerado

## Segurança e Conformidade

### Segurança

- Toda comunicação com serviços de pagamento é feita via HTTPS
- Dados sensíveis não são armazenados localmente
- Autenticações via tokens com expiração
- Validação de dados em tempo real

### Conformidade PCI DSS

Para transações com cartão, o sistema segue as diretrizes PCI DSS:

1. Nunca armazena dados completos do cartão
2. Utiliza criptografia para transmissão de dados
3. Implementa controles de acesso
4. Mantém logs de auditoria para todas as transações
5. Testa regularmente a segurança do sistema

## Comprovantes e Recibos

O sistema gera automaticamente comprovantes para todas as transações:

- **Formatos Disponíveis**:
  - Impressão direta em impressora térmica
  - PDF para download
  - Envio por e-mail

- **Informações do Comprovante**:
  - Dados da empresa
  - Detalhes da transação
  - Método de pagamento
  - Dados do cliente (quando disponível)
  - Código de autorização
  - Timestamp da transação

## Tratamento de Erros e Timeout

O sistema implementa estratégias robustas para lidar com falhas:

1. **Timeout**: 
   - Configurável para cada operação
   - Padrão de 15 segundos para operações de pagamento
   - Feedback visual ao usuário durante processamento

2. **Erros de Comunicação**:
   - Reconexão automática
   - Armazenamento local para permitir reenvio
   - Mensagens de erro claras para o usuário

3. **Falhas de Processamento**:
   - Registro detalhado de erros para diagnóstico
   - Opção de estorno automático em caso de falha parcial
   - Suporte a cancelamento manual de transações

## Integração no Sistema

Para integrar o processador de pagamento em suas páginas, utilize o componente `PaymentProcessor`:

```jsx
import PaymentProcessor from '../components/payment/PaymentProcessor';

// Dentro do seu componente
<PaymentProcessor
  amount={150.75}
  reference="PEDIDO-12345"
  customerName="Nome do Cliente"
  customerEmail="cliente@exemplo.com"
  customerDocument="123.456.789-00"
  orderItems={[
    { name: "Produto 1", quantity: 2, unitPrice: 50, total: 100 },
    { name: "Produto 2", quantity: 1, unitPrice: 50.75, total: 50.75 }
  ]}
  onPaymentComplete={(transaction) => {
    console.log("Pagamento concluído:", transaction);
    // Atualizar estado do pedido, redirecionar, etc.
  }}
  onCancel={() => {
    console.log("Pagamento cancelado");
    // Lidar com o cancelamento
  }}
  companyName="Sua Empresa"
  companyDocument="12.345.678/0001-90"
  companyAddress="Endereço da sua empresa"
  companyPhone="(11) 1234-5678"
  logoUrl="/caminho/para/seu/logo.png"
/>
```

## Configuração

O sistema utiliza as seguintes variáveis de ambiente:

```
VITE_PAYMENT_API_URL=https://api.processadora.com/v1
VITE_PAYMENT_API_KEY=sua-chave-de-api
VITE_PAYMENT_SECRET_KEY=sua-chave-secreta
VITE_PAYMENT_MERCHANT_ID=seu-id-de-comerciante
VITE_PAYMENT_ENVIRONMENT=production|sandbox
```

## Processadores de Pagamento Suportados

O sistema foi projetado para ser agnóstico quanto à processadora de pagamentos. Atualmente, as seguintes integrações são suportadas:

- Cielo
- Stone
- Mercado Pago
- PagSeguro
- Rede

## Extensão e Personalização

Para adicionar novos métodos de pagamento:

1. Adicione o novo tipo em `PaymentMethodType`
2. Crie um novo componente para o método de pagamento
3. Implemente a lógica de processamento no `PaymentService`
4. Adicione o novo método ao `PaymentMethodSelector` e `PaymentProcessor`

## Depuração e Diagnóstico

Para auxiliar na depuração, o sistema registra logs detalhados de todas as transações:

- Status de conexão com processadoras
- Códigos de resposta de transações
- Tempos de resposta
- Dados completos de respostas (sem informações sensíveis)

Esses logs podem ser acessados via console ou, em uma implementação completa, via painel administrativo.

## Limitações Conhecidas

- O modo offline é limitado a pagamentos em dinheiro
- Alguns processadores podem exigir configurações adicionais específicas
- O estorno de transações PIX pode não ser suportado por todos os bancos