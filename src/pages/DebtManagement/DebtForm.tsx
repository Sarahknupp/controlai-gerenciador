import React, { useState, useEffect } from 'react';
import { Debt, DebtFormData, DebtCategory, DebtStatus } from '../../types/debt';
import { Calendar, Clock, Contact, FileText, CreditCard, Phone, Mail, MapPin, Repeat, AlertCircle } from 'lucide-react';

interface DebtFormProps {
  debt?: Debt | null;
  categories: DebtCategory[];
  onSubmit: (formData: DebtFormData) => void;
  onCancel: () => void;
}

const DebtForm: React.FC<DebtFormProps> = ({ debt, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<DebtFormData>({
    debtor_name: '',
    amount: '',
    due_date: '',
    category_id: '',
    description: '',
    status: 'pending',
    notes: '',
    document_number: '',
    contact_info: {
      phone: '',
      email: '',
      address: '',
    },
    payment_info: {
      payment_method: '',
      bank_details: '',
      installments: 1,
    },
    recurring: false,
    recurrence_info: {
      frequency: 'monthly',
      day: '',
      end_date: '',
      times: '',
    },
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Initialize form with debt data if editing
  useEffect(() => {
    if (debt) {
      setFormData({
        debtor_name: debt.debtor_name,
        amount: debt.amount,
        due_date: debt.due_date.split('T')[0], // Format date for input
        category_id: debt.category_id || '',
        description: debt.description || '',
        status: debt.status,
        notes: debt.notes || '',
        document_number: debt.document_number || '',
        contact_info: debt.contact_info || {
          phone: '',
          email: '',
          address: '',
        },
        payment_info: debt.payment_info || {
          payment_method: '',
          bank_details: '',
          installments: 1,
        },
        recurring: debt.recurring || false,
        recurrence_info: debt.recurrence_info || {
          frequency: 'monthly',
          day: '',
          end_date: '',
          times: '',
        },
      });

      // Show advanced fields if they have data
      if (
        debt.contact_info || 
        debt.payment_info || 
        debt.recurring || 
        debt.document_number
      ) {
        setShowAdvanced(true);
      }
    }
  }, [debt]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof DebtFormData] as any),
          [child]: value,
        },
      });
    } else if (name === 'recurring') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error when field is filled
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  // Validate form on submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.debtor_name.trim()) {
      errors.debtor_name = 'Nome do devedor é obrigatório';
    }

    if (!formData.amount) {
      errors.amount = 'Valor é obrigatório';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Valor deve ser um número maior que zero';
    }

    if (!formData.due_date) {
      errors.due_date = 'Data de vencimento é obrigatória';
    }

    if (!formData.category_id) {
      errors.category_id = 'Categoria é obrigatória';
    }

    // Recurring validation
    if (formData.recurring) {
      if (!formData.recurrence_info?.frequency) {
        errors['recurrence_info.frequency'] = 'Frequência é obrigatória';
      }

      // Validate either end date or number of times
      if (
        !formData.recurrence_info?.end_date && 
        !formData.recurrence_info?.times
      ) {
        errors['recurrence_info.end_date'] = 'Informe a data final ou o número de vezes';
      }
    }

    // Contact info validation
    if (formData.contact_info?.email && !/\S+@\S+\.\S+/.test(formData.contact_info.email)) {
      errors['contact_info.email'] = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  // Go to next step
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate required fields in step 1
      const errors: Record<string, string> = {};
      
      if (!formData.debtor_name.trim()) {
        errors.debtor_name = 'Nome do devedor é obrigatório';
      }

      if (!formData.amount) {
        errors.amount = 'Valor é obrigatório';
      } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        errors.amount = 'Valor deve ser um número maior que zero';
      }

      if (!formData.due_date) {
        errors.due_date = 'Data de vencimento é obrigatória';
      }

      if (!formData.category_id) {
        errors.category_id = 'Categoria é obrigatória';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  // Go to previous step
  const goToPrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[70vh]">
      {/* Step indicators */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full">
          <div 
            className={`h-1 flex-1 ${currentStep >= 1 ? 'bg-primary' : 'bg-gray-200'}`}
          ></div>
          <div 
            className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}
          ></div>
          <div 
            className={`h-1 flex-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}
          ></div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
          
          <div>
            <label htmlFor="debtor_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Devedor *
            </label>
            <input
              id="debtor_name"
              name="debtor_name"
              type="text"
              className={`input ${formErrors.debtor_name ? 'border-red-300' : ''}`}
              value={formData.debtor_name}
              onChange={handleInputChange}
              placeholder="Nome da pessoa ou empresa"
            />
            {formErrors.debtor_name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.debtor_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Valor *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">R$</span>
              </div>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className={`input pl-10 ${formErrors.amount ? 'border-red-300' : ''}`}
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0,00"
              />
            </div>
            {formErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="due_date"
                name="due_date"
                type="date"
                className={`input pl-10 ${formErrors.due_date ? 'border-red-300' : ''}`}
                value={formData.due_date}
                onChange={handleInputChange}
              />
            </div>
            {formErrors.due_date && (
              <p className="mt-1 text-sm text-red-600">{formErrors.due_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              id="category_id"
              name="category_id"
              className={`input ${formErrors.category_id ? 'border-red-300' : ''}`}
              value={formData.category_id}
              onChange={handleInputChange}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.category_id && (
              <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              className="input"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="pending">Pendente</option>
              <option value="partial">Parcialmente Pago</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
              <option value="renegotiated">Renegociado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Detalhes Adicionais</h3>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Descrição da dívida ou detalhes relevantes"
            />
          </div>

          <div>
            <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
              Número do Documento
            </label>
            <input
              id="document_number"
              name="document_number"
              type="text"
              className="input"
              value={formData.document_number || ''}
              onChange={handleInputChange}
              placeholder="Número da nota fiscal, contrato, etc."
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center">
              <input
                id="recurring"
                name="recurring"
                type="checkbox"
                checked={formData.recurring}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="ml-2 block text-sm font-medium text-gray-700">
                É uma dívida recorrente?
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Marque para dívidas que se repetem como aluguel, assinaturas, etc.
            </p>
          </div>

          {formData.recurring && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-2">
              <div>
                <label htmlFor="recurrence_info.frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência *
                </label>
                <select
                  id="recurrence_info.frequency"
                  name="recurrence_info.frequency"
                  className={`input ${formErrors['recurrence_info.frequency'] ? 'border-red-300' : ''}`}
                  value={formData.recurrence_info?.frequency || 'monthly'}
                  onChange={handleInputChange}
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
                {formErrors['recurrence_info.frequency'] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors['recurrence_info.frequency']}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurrence_info.times" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Recorrências
                  </label>
                  <input
                    id="recurrence_info.times"
                    name="recurrence_info.times"
                    type="number"
                    className="input"
                    value={formData.recurrence_info?.times || ''}
                    onChange={handleInputChange}
                    placeholder="Quantas vezes?"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="recurrence_info.end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    id="recurrence_info.end_date"
                    name="recurrence_info.end_date"
                    type="date"
                    className={`input ${formErrors['recurrence_info.end_date'] ? 'border-red-300' : ''}`}
                    value={formData.recurrence_info?.end_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {formErrors['recurrence_info.end_date'] && (
                <p className="text-sm text-red-600">{formErrors['recurrence_info.end_date']}</p>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <AlertCircle className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium text-blue-600">Informação</span>
                </div>
                <p className="text-sm text-blue-600">
                  Preencha o número de repetições OU a data final (não é necessário preencher ambos).
                  Serão criados até 12 registros de dívida.
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input"
              value={formData.notes || ''}
              onChange={handleInputChange}
              placeholder="Observações adicionais sobre a dívida"
            />
          </div>
        </div>
      )}

      {/* Step 3: Contact and Payment Info */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informações de Contato e Pagamento</h3>

          <fieldset className="space-y-3 border-b pb-4">
            <legend className="text-sm font-medium text-gray-700">Informações de Contato</legend>
            
            <div>
              <label htmlFor="contact_info.phone" className="block text-sm text-gray-700 mb-1">
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="contact_info.phone"
                  name="contact_info.phone"
                  type="tel"
                  className="input pl-10"
                  value={formData.contact_info?.phone || ''}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact_info.email" className="block text-sm text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="contact_info.email"
                  name="contact_info.email"
                  type="email"
                  className={`input pl-10 ${formErrors['contact_info.email'] ? 'border-red-300' : ''}`}
                  value={formData.contact_info?.email || ''}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
                {formErrors['contact_info.email'] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors['contact_info.email']}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="contact_info.address" className="block text-sm text-gray-700 mb-1">
                Endereço
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="contact_info.address"
                  name="contact_info.address"
                  type="text"
                  className="input pl-10"
                  value={formData.contact_info?.address || ''}
                  onChange={handleInputChange}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 pt-2">
            <legend className="text-sm font-medium text-gray-700">Informações de Pagamento</legend>

            <div>
              <label htmlFor="payment_info.payment_method" className="block text-sm text-gray-700 mb-1">
                Forma de Pagamento Preferencial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="payment_info.payment_method"
                  name="payment_info.payment_method"
                  className="input pl-10"
                  value={formData.payment_info?.payment_method || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="check">Cheque</option>
                  <option value="billet">Boleto</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="payment_info.bank_details" className="block text-sm text-gray-700 mb-1">
                Dados Bancários
              </label>
              <input
                id="payment_info.bank_details"
                name="payment_info.bank_details"
                type="text"
                className="input"
                value={formData.payment_info?.bank_details || ''}
                onChange={handleInputChange}
                placeholder="Banco, agência, conta, etc."
              />
            </div>

            <div>
              <label htmlFor="payment_info.installments" className="block text-sm text-gray-700 mb-1">
                Número de Parcelas
              </label>
              <input
                id="payment_info.installments"
                name="payment_info.installments"
                type="number"
                min="1"
                className="input"
                value={formData.payment_info?.installments || 1}
                onChange={handleInputChange}
              />
            </div>
          </fieldset>
        </div>
      )}

      {/* Form actions */}
      <div className="mt-8 flex justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            className="btn-outline"
            onClick={goToPrevStep}
          >
            Voltar
          </button>
        ) : (
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={goToNextStep}
          >
            Continuar
          </button>
        ) : (
          <button
            type="submit"
            className="btn-primary"
          >
            {debt ? 'Salvar Alterações' : 'Registrar Dívida'}
          </button>
        )}
      </div>
    </form>
  );
};

export default DebtForm;