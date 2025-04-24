# Documentação da Integração Fiscal

Esta documentação descreve a implementação da integração para emissão de documentos fiscais (NFC-e e NF-e) no sistema Controlaí.

## Arquitetura da Solução

A solução é composta por:

1. **Componentes de UI**:
   - `FiscalDocumentButton`: Botão para emissão de documentos fiscais
   - `FiscalDocumentModal`: Modal para emissão e visualização de documentos
   - `FiscalDocumentSection`: Seção para exibir e gerenciar documentos relacionados a uma venda
   - `FiscalDocumentWidget`: Widget para monitorar status do serviço fiscal

2. **Serviço de Integração**:
   - `fiscalService`: Classe singleton para comunicação com a API fiscal

## API de Documentos Fiscais

### Endpoints Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/documents` | POST | Emite um novo documento fiscal |
| `/documents/{id}` | GET | Obtém informações de um documento existente |
| `/documents/{id}/cancel` | POST | Cancela um documento fiscal |
| `/documents/{id}/print` | POST | Envia documento para impressão |
| `/documents/{id}/email` | POST | Envia documento por e-mail |
| `/documents/{id}/pdf` | GET | Obtém o PDF do documento |
| `/status` | GET | Verifica status do serviço fiscal |

### Formato do Payload para Emissão

```json
{
  "company_id": "string",
  "document_type": "nfce|nfe|sat|cfe|none",
  "is_test": boolean,
  "contingency_mode": boolean,
  "customer": {
    "name": "string",
    "document": "string"
  },
  "items": [
    {
      "code": "string",
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total": number,
      "tax_rate": number,
      "tax_amount": number
    }
  ],
  "payments": [
    {
      "method": "string",
      "amount": number
    }
  ],
  "total": number,
  "discount_amount": number,
  "tax_amount": number,
  "additional_info": "string"
}
```

### Códigos de Retorno

| Código | Descrição |
|--------|-----------|
| 200/201 | Sucesso na operação |
| 400 | Dados inválidos ou incompletos |
| 401 | Não autorizado (problema com autenticação) |
| 403 | Acesso proibido |
| 404 | Documento não encontrado |
| 422 | Erro de validação dos dados |
| 500 | Erro interno do servidor |

## Fluxo de Operação

### Emissão de Documento Fiscal

1. O usuário clica no botão "Emitir Nota Fiscal"
2. O sistema valida os dados da venda e dos produtos
3. Os dados são enviados para a API fiscal via `fiscalService.issueFiscalDocument()`
4. Durante o processamento, é exibido feedback visual de "processando"
5. Após o processamento, o resultado é exibido ao usuário (sucesso ou erro)
6. Em caso de sucesso, o documento pode ser impresso, enviado por e-mail ou baixado

### Modo Contingência

Quando a API fiscal está indisponível:

1. O sistema detecta a falha de comunicação
2. Ativa o modo de contingência automaticamente
3. A emissão é registrada localmente (localStorage)
4. Um processo de sincronização é responsável por emitir os documentos pendentes quando a API estiver disponível novamente

## Tratamento de Erros

1. **Erro de Conexão**: 
   - Documentos são armazenados localmente
   - Exibição de feedback ao usuário
   - Sincronização automática quando a conexão for restaurada

2. **Erro de Validação**:
   - Mensagem específica é exibida ao usuário
   - Log detalhado é registrado para depuração

3. **Erro de Autorização**:
   - Feedback ao usuário sobre problema de autorização
   - Opção para tentar novamente com credenciais atualizadas

4. **Timeout**:
   - Configurado para 15 segundos nas chamadas principais
   - Feedback visual e opção para nova tentativa

## Cache e Performance

1. **Armazenamento Local**:
   - Documentos emitidos são armazenados no localStorage
   - Reduz necessidade de buscar novamente da API

2. **Verificação Periódica**:
   - Status da API é verificado periodicamente
   - Documentos offline são sincronizados quando a API está disponível

## Conformidade Fiscal

Esta implementação está de acordo com:

- Nota Técnica 2019.001 v1.60 - NFC-e
- Nota Técnica 2019.001 v1.50 - NF-e
- Manual de Integração - Contribuinte v7.0

## Segurança

- Toda a comunicação é feita via HTTPS
- Chaves de API são armazenadas em variáveis de ambiente
- Validação rigorosa de dados antes do envio
- Logs detalhados para auditoria

## Configuração

As configurações da API fiscal são definidas através de variáveis de ambiente:

- `VITE_FISCAL_API_URL`: URL base da API fiscal
- `VITE_FISCAL_API_KEY`: Chave de API para autenticação
- `VITE_FISCAL_COMPANY_ID`: Identificador da empresa
- `VITE_FISCAL_TEST_MODE`: Modo de teste (true/false)