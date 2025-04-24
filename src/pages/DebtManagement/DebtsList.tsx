import React from 'react';
import { Debt, DebtCategory, DebtStatus } from '../../types/debt';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  DollarSign, 
  Tag, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  FileText,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DebtsListProps {
  debts: Debt[];
  categories: DebtCategory[];
  expandedDebtIds: string[];
  onToggleExpand: (debtId: string) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onRegisterPayment: (debt: Debt) => void;
  formatStatus: (status: DebtStatus) => string;
  getStatusColor: (status: DebtStatus) => string;
}

const DebtsList: React.FC<DebtsListProps> = ({
  debts,
  categories,
  expandedDebtIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onRegisterPayment,
  formatStatus,
  getStatusColor
}) => {
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem Categoria';
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Devedor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
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
            {debts.map((debt) => (
              <React.Fragment key={debt.id}>
                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onToggleExpand(debt.id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {expandedDebtIds.includes(debt.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <div className="ml-1">
                        <div className="text-sm font-medium text-gray-900">{debt.debtor_name}</div>
                        {debt.document_number && (
                          <div className="text-xs text-gray-500">Doc: {debt.document_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {debt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {debt.recurring && (
                      <span className="text-xs text-blue-600 font-medium">Recorrente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(debt.due_date), { addSuffix: true, locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                      {getCategoryName(debt.category_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(debt.status)}`}>
                      {formatStatus(debt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegisterPayment(debt);
                        }}
                        className="text-primary hover:text-primary-dark"
                        title="Registrar Pagamento"
                      >
                        <DollarSign className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(debt);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar Dívida"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(debt.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir Dívida"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded row with details */}
                {expandedDebtIds.includes(debt.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-8 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Detalhes da Dívida</h4>
                          <div className="bg-white p-3 rounded-lg shadow-sm text-sm">
                            {debt.description && (
                              <div className="mb-3">
                                <div className="text-gray-500 mb-1">Descrição:</div>
                                <div className="text-gray-800">{debt.description}</div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <div className="text-gray-500 mb-1">Criado em:</div>
                                <div className="text-gray-800">{new Date(debt.created_at).toLocaleDateString('pt-BR')}</div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500 mb-1">Última atualização:</div>
                                <div className="text-gray-800">{new Date(debt.updated_at).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                            
                            {debt.notes && (
                              <div>
                                <div className="text-gray-500 mb-1">Observações:</div>
                                <div className="text-gray-800 bg-gray-50 p-2 rounded">{debt.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Informações de Contato</h4>
                          <div className="bg-white p-3 rounded-lg shadow-sm text-sm">
                            {debt.contact_info && (
                              <div>
                                {debt.contact_info.phone && (
                                  <div className="flex items-center mb-3">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>{debt.contact_info.phone}</span>
                                  </div>
                                )}
                                
                                {debt.contact_info.email && (
                                  <div className="flex items-center mb-3">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>{debt.contact_info.email}</span>
                                  </div>
                                )}
                                
                                {debt.contact_info.address && (
                                  <div>
                                    <div className="text-gray-500 mb-1">Endereço:</div>
                                    <div className="text-gray-800">{debt.contact_info.address}</div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {(!debt.contact_info || 
                              (!debt.contact_info.phone && 
                               !debt.contact_info.email && 
                               !debt.contact_info.address)) && (
                              <div className="text-gray-500 italic">Nenhuma informação de contato cadastrada</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Informações de Pagamento</h4>
                          <div className="bg-white p-3 rounded-lg shadow-sm text-sm">
                            {debt.payment_info && (
                              <div>
                                {debt.payment_info.payment_method && (
                                  <div className="mb-3">
                                    <div className="text-gray-500 mb-1">Forma de Pagamento:</div>
                                    <div className="text-gray-800">
                                      {debt.payment_info.payment_method === 'bank_transfer' && 'Transferência Bancária'}
                                      {debt.payment_info.payment_method === 'credit_card' && 'Cartão de Crédito'}
                                      {debt.payment_info.payment_method === 'debit_card' && 'Cartão de Débito'}
                                      {debt.payment_info.payment_method === 'cash' && 'Dinheiro'}
                                      {debt.payment_info.payment_method === 'pix' && 'Pix'}
                                      {debt.payment_info.payment_method === 'check' && 'Cheque'}
                                      {debt.payment_info.payment_method === 'billet' && 'Boleto'}
                                    </div>
                                  </div>
                                )}
                                
                                {debt.payment_info.bank_details && (
                                  <div className="mb-3">
                                    <div className="text-gray-500 mb-1">Dados Bancários:</div>
                                    <div className="text-gray-800">{debt.payment_info.bank_details}</div>
                                  </div>
                                )}
                                
                                {debt.payment_info.installments && debt.payment_info.installments > 1 && (
                                  <div>
                                    <div className="text-gray-500 mb-1">Parcelas:</div>
                                    <div className="text-gray-800">{debt.payment_info.installments}x</div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {(!debt.payment_info || 
                              (!debt.payment_info.payment_method && 
                               !debt.payment_info.bank_details && 
                               (!debt.payment_info.installments || debt.payment_info.installments <= 1))) && (
                              <div className="text-gray-500 italic">Nenhuma informação de pagamento cadastrada</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => onRegisterPayment(debt)}
                          className="btn-primary py-1 px-4 text-sm"
                        >
                          <DollarSign className="h-4 w-4 mr-1 inline" />
                          Registrar Pagamento
                        </button>
                        <button
                          onClick={() => onEdit(debt)}
                          className="btn-outline py-1 px-4 text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1 inline" />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebtsList;