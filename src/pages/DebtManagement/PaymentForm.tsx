import React, { useState } from 'react';
import { Debt } from '../../types/debt';
import { Calendar, DollarSign, FileText, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  debt: Debt;
  onSubmit: (paymentData: any) => void;
  onCancel: () => void;
}

interface PaymentFormData {
  amount: string;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ debt, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: debt.amount.toString(),
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: debt.payment_info?.payment_method || '',
    receipt_number: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

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
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Valor deve ser maior que zero';
    } else if (parseFloat(formData.amount) > debt.amount && debt.status !== 'partial') {
      errors.amount = `Valor não pode ser maior que o valor da dívida (R$ ${debt.amount})`;
    }

    if (!formData.payment_date) {
      errors.payment_date = 'Data de pagamento é obrigatória';
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

    // Format data for submission
    const formattedData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Valor do Pagamento *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
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
        <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
          Data do Pagamento *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="payment_date"
            name="payment_date"
            type="date"
            className={`input pl-10 ${formErrors.payment_date ? 'border-red-300' : ''}`}
            value={formData.payment_date}
            onChange={handleInputChange}
          />
        </div>
        {formErrors.payment_date && (
          <p className="mt-1 text-sm text-red-600">{formErrors.payment_date}</p>
        )}
      </div>

      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
          Forma de Pagamento
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <select
            id="payment_method"
            name="payment_method"
            className="input pl-10"
            value={formData.payment_method}
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
        <label htmlFor="receipt_number" className="block text-sm font-medium text-gray-700 mb-1">
          Número do Comprovante
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="receipt_number"
            name="receipt_number"
            type="text"
            className="input pl-10"
            value={formData.receipt_number}
            onChange={handleInputChange}
            placeholder="Número ou identificação do comprovante"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="input"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Informações adicionais sobre o pagamento"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          className="btn-outline"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Registrar Pagamento
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;