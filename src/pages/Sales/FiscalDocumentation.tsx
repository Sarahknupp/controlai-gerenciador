import React, { useState } from 'react';
import { 
  FileText, 
  InfoIcon, 
  List, 
  AlertTriangle, 
  Layers, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft
} from 'lucide-react';
import FiscalDocumentExample from '../../components/FiscalDocumentExample';

/**
 * Página de documentação e gerenciamento fiscal
 */
const FiscalDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guide' | 'documents' | 'settings'>('guide');
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ChevronLeft 
            className="h-5 w-5 text-gray-500 mr-2 cursor-pointer hover:text-gray-700"
            onClick={() => window.history.back()}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentos Fiscais</h1>
            <p className="text-gray-500">Emissão e gerenciamento de documentos fiscais (NFC-e / NF-e)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('guide')}
            className={`${
              activeTab === 'guide'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Guia de Utilização
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Documentos Emitidos
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Configurações
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Exemplo de integração */}
          <FiscalDocumentExample />
          
          {/* Instruções */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <InfoIcon className="h-5 w-5 mr-2 text-primary" />
                Guia de Utilização
              </h3>
            </div>
            
            <div className="p-6">
              <div className="prose max-w-none">
                <h4>Como emitir documentos fiscais</h4>
                <p>
                  A emissão de documentos fiscais pode ser realizada de duas formas no sistema:
                </p>
                
                <ol>
                  <li>
                    <strong>Emissão automática no checkout:</strong> Durante o fechamento da venda no PDV, 
                    o sistema oferece a opção de emitir automaticamente a NFC-e. Este é o método recomendado 
                    para vendas de balcão.
                  </li>
                  <li>
                    <strong>Emissão posterior:</strong> Para vendas já finalizadas, é possível emitir 
                    NFC-e ou NF-e através da tela de detalhes da venda ou na seção de "Documentos Emitidos".
                  </li>
                </ol>
                
                <h4>Diferença entre NFC-e e NF-e</h4>
                <p>
                  É importante entender quando utilizar cada tipo de documento fiscal:
                </p>
                
                <ul>
                  <li>
                    <strong>NFC-e (Nota Fiscal de Consumidor Eletrônica):</strong> 
                    Utilizada para vendas a consumidor final (pessoas físicas). Substitui o cupom 
                    fiscal e é mais adequada para vendas de balcão.
                  </li>
                  <li>
                    <strong>NF-e (Nota Fiscal Eletrônica):</strong> 
                    Utilizada para vendas a empresas (CNPJ) ou quando o cliente solicitar expressamente, 
                    mesmo sendo pessoa física. Contém mais campos e informações fiscais detalhadas.
                  </li>
                </ul>
                
                <div className="bg-yellow-50 p-4 rounded-md my-4 border-l-4 border-yellow-400">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Atenção</h4>
                      <p className="text-sm text-yellow-700">
                        A emissão de documentos fiscais é uma obrigação legal. O não cumprimento pode 
                        acarretar em multas e sanções da Secretaria da Fazenda. Mantenha-se em dia com 
                        suas obrigações fiscais.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h4>Modo de Contingência</h4>
                <p>
                  Em caso de problemas de conexão com a SEFAZ ou indisponibilidade do serviço, o sistema 
                  ativa automaticamente o modo de contingência, permitindo a continuidade das operações.
                  Os documentos emitidos em contingência serão sincronizados assim que a conexão for 
                  reestabelecida.
                </p>
                
                <h4>Requisitos Técnicos</h4>
                <p>
                  Para utilização adequada da emissão fiscal, certifique-se que:
                </p>
                
                <ul>
                  <li>A conexão com a internet está funcionando adequadamente</li>
                  <li>Certificado digital A1 está válido e configurado</li>
                  <li>Os cadastros de produtos estão com informações fiscais completas (NCM, CFOP, etc.)</li>
                  <li>As configurações fiscais no sistema estão de acordo com o regime tributário da empresa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Buscar por número, cliente ou chave de acesso..."
              />
            </div>
            <button className="btn-outline py-2">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
            <button className="btn-outline py-2">
              <Calendar className="h-4 w-4 mr-2" />
              Período
            </button>
            <button className="btn-outline py-2">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
          
          {/* Lista de documentos */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <List className="h-5 w-5 mr-2 text-primary" />
                Documentos Fiscais Emitidos
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emissão
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Exemplos de documentos fiscais */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NFC-e
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      000123456
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Consumidor Final
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      15/05/2025 14:30
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ 150,75
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Autorizada
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary hover:text-primary-dark mr-3">Visualizar</a>
                      <a href="#" className="text-gray-600 hover:text-gray-900">Imprimir</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NF-e
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      000123455
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Empresa ABC Ltda.
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      15/05/2025 11:20
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ 2.450,00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Autorizada
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary hover:text-primary-dark mr-3">Visualizar</a>
                      <a href="#" className="text-gray-600 hover:text-gray-900">Imprimir</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NFC-e
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      000123454
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Maria Silva
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      14/05/2025 16:45
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ 78,50
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Processando
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary hover:text-primary-dark mr-3">Visualizar</a>
                      <a href="#" className="text-gray-400 cursor-not-allowed">Imprimir</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NFC-e
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      000123453
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Consumidor Final
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      14/05/2025 10:30
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ 45,90
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeitada
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary hover:text-primary-dark mr-3">Visualizar</a>
                      <a href="#" className="text-red-600 hover:text-red-900">Corrigir</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NF-e
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      000123452
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      João Comercial ME
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      13/05/2025 09:15
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ 1.275,30
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelada
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary hover:text-primary-dark mr-3">Visualizar</a>
                      <a href="#" className="text-gray-600 hover:text-gray-900">Imprimir</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Anterior
                </a>
                <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Próxima
                </a>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de <span className="font-medium">24</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" />
                    </a>
                    <a href="#" aria-current="page" className="z-10 bg-primary-light text-primary relative inline-flex items-center px-4 py-2 border border-primary-light text-sm font-medium">
                      1
                    </a>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      2
                    </a>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      3
                    </a>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      8
                    </a>
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Próxima</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-primary" />
                Configurações Fiscais
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      URL da API Fiscal
                    </label>
                    <input
                      type="text"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="https://api.fiscal.example.com/v1"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Chave de API
                    </label>
                    <input
                      type="password"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="****************************"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      ID da Empresa
                    </label>
                    <input
                      type="text"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="empresa-123"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ambiente
                    </label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      defaultValue="1"
                    >
                      <option value="1">Produção</option>
                      <option value="2">Homologação (Testes)</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Certificado Digital
                    </label>
                    <div className="mt-1 flex">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Atualizar Certificado
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Validade até: 31/12/2025</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="contingency"
                          name="contingency"
                          type="checkbox"
                          className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                          defaultChecked={true}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="contingency" className="font-medium text-gray-700">Habilitar modo de contingência automático</label>
                        <p className="text-gray-500">Em caso de falha na comunicação com a SEFAZ, o sistema emitirá documentos em contingência automaticamente.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Texto Adicional para Documentos (Corpo de Notas)
                    </label>
                    <div className="mt-1">
                      <textarea
                        rows={3}
                        className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                        defaultValue="Obrigado pela preferência! Para mais informações sobre nossa política de trocas e devoluções, acesse nosso site."
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Este texto será incluído em todas as notas fiscais emitidas.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
          
          {/* Requisitos Fiscais */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Requisitos Legais</h3>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <p>
                  A emissão de documentos fiscais eletrônicos é regulamentada pela legislação 
                  vigente e requer a conformidade com diversas normas. Abaixo estão os principais
                  requisitos legais para emissão de NFC-e e NF-e:
                </p>
                
                <h4>Requisitos Técnicos</h4>
                <ul>
                  <li>Certificado Digital A1 ou A3 válido e vigente</li>
                  <li>Cadastro atualizado na Secretaria da Fazenda Estadual</li>
                  <li>Credenciamento para emissão de NFC-e/NF-e</li>
                  <li>Conexão com a internet para comunicação com o ambiente de autorização</li>
                </ul>
                
                <h4>Obrigatoriedade de Campos</h4>
                <ul>
                  <li>Informações completas do emitente (CNPJ, IE, endereço, etc.)</li>
                  <li>Descrição detalhada dos produtos/serviços</li>
                  <li>Informações fiscais dos produtos (NCM, CFOP, CST, etc.)</li>
                  <li>Valores e cálculos de impostos conforme legislação</li>
                </ul>
                
                <h4>Prazos e Obrigações</h4>
                <ul>
                  <li>Emissão em tempo real ou próxima do momento da operação</li>
                  <li>Prazo de cancelamento: até 24 horas após a autorização</li>
                  <li>Guarda dos documentos fiscais pelo prazo legal (5 anos)</li>
                </ul>
                
                <div className="bg-blue-50 p-4 rounded-md my-4">
                  <div className="flex">
                    <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Consultoria Fiscal</h4>
                      <p className="text-sm text-blue-700">
                        Em caso de dúvidas específicas sobre a legislação fiscal aplicável ao seu negócio,
                        recomendamos consultar um contador ou especialista tributário. O sistema apenas
                        implementa as regras configuradas, mas a responsabilidade fiscal é do emissor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalDocumentation;