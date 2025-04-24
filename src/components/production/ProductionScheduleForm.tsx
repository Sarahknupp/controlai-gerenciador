import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  Save, 
  X, 
  RotateCcw, 
  Info,
  CheckSquare
} from 'lucide-react';
import { ProductionSchedule, Recipe } from '../../types/production';

interface ProductionScheduleFormProps {
  recipes: Recipe[];
  resources: Array<{ id: string; name: string; type: string }>;
  existingSchedule?: ProductionSchedule;
  onSave: (schedule: Partial<ProductionSchedule>) => Promise<void>;
  onCancel: () => void;
}

const ProductionScheduleForm: React.FC<ProductionScheduleFormProps> = ({
  recipes,
  resources,
  existingSchedule,
  onSave,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<ProductionSchedule>>({
    recipeId: '',
    recipeName: '',
    productId: '',
    quantity: 0,
    unit: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    priority: 'normal',
    status: 'scheduled',
    assignedTo: '',
    notes: ''
  });

  // Find conflicts for the selected time and resources
  const findScheduleConflicts = () => {
    // In a real app, this would call an API to check conflicts
    // Here we'll just simulate some conflicts based on the data
    
    const newConflicts = [];
    
    // Check if the end time is before the start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (end <= start) {
        newConflicts.push('O horário de término deve ser posterior ao horário de início');
      }
    }
    
    // Check for resource conflicts
    if (formData.assignedTo) {
      // Simulated conflict for a specific date and resource
      if (formData.scheduledDate === '2025-05-18' && formData.assignedTo === 'team1') {
        newConflicts.push('Equipe 1 já possui um agendamento para este horário');
      }
      
      // Simulated conflict for a specific resource
      if (formData.assignedTo === 'equipment1' && formData.startTime === '09:00') {
        newConflicts.push('Forno 1 já está em uso às 9:00');
      }
    }
    
    // Check if quantity exceeds capacity
    const selectedRecipe = recipes.find(r => r.id === formData.recipeId);
    if (selectedRecipe && formData.quantity && formData.quantity > 100) {
      newConflicts.push(`A capacidade máxima para ${selectedRecipe.productName} é 100 unidades por lote`);
    }
    
    setConflicts(newConflicts);
  };

  // Initialize form with existing schedule data
  useEffect(() => {
    if (existingSchedule) {
      setFormData({
        id: existingSchedule.id,
        recipeId: existingSchedule.recipeId,
        recipeName: existingSchedule.recipeName,
        productId: existingSchedule.productId,
        quantity: existingSchedule.quantity,
        unit: existingSchedule.unit,
        scheduledDate: new Date(existingSchedule.scheduledDate).toISOString().split('T')[0],
        startTime: existingSchedule.startTime,
        endTime: existingSchedule.endTime,
        priority: existingSchedule.priority,
        status: existingSchedule.status,
        assignedTo: existingSchedule.assignedTo || '',
        notes: existingSchedule.notes || ''
      });
    }
  }, [existingSchedule]);

  // Check for conflicts when form data changes
  useEffect(() => {
    if (formData.recipeId && formData.scheduledDate && formData.startTime && formData.endTime && formData.assignedTo) {
      findScheduleConflicts();
    }
  }, [formData.recipeId, formData.scheduledDate, formData.startTime, formData.endTime, formData.assignedTo]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If selecting a new recipe, update related fields
    if (name === 'recipeId') {
      const selectedRecipe = recipes.find(recipe => recipe.id === value);
      if (selectedRecipe) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          recipeName: selectedRecipe.productName,
          productId: selectedRecipe.productId,
          unit: selectedRecipe.currentVersion.yieldUnit
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error if field is now valid
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);

    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue
    }));

    // Clear validation error if field is now valid
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Calculate production time based on recipe and quantity
  const calculateProductionTime = () => {
    if (formData.recipeId && formData.quantity) {
      const selectedRecipe = recipes.find(recipe => recipe.id === formData.recipeId);
      if (selectedRecipe) {
        // Simple time calculation based on recipe preparation time and quantity
        // In a real app, this would be more sophisticated
        const baseTimeInMinutes = selectedRecipe.prepTime + selectedRecipe.cookTime;
        const estimatedTimeInMinutes = Math.ceil(baseTimeInMinutes * (formData.quantity / selectedRecipe.currentVersion.yield));
        
        // Convert to hours and minutes
        const hours = Math.floor(estimatedTimeInMinutes / 60);
        const minutes = estimatedTimeInMinutes % 60;
        
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
      }
    }
    return 'Tempo não calculado';
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Check required fields
    if (!formData.recipeId) {
      errors.recipeId = 'Receita é obrigatória';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Data é obrigatória';
    }

    if (!formData.startTime) {
      errors.startTime = 'Hora de início é obrigatória';
    }

    if (!formData.endTime) {
      errors.endTime = 'Hora de término é obrigatória';
    }

    if (!formData.assignedTo) {
      errors.assignedTo = 'Atribuição é obrigatória';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-800">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Conflicts warning */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Conflitos Detectados</h3>
              <ul className="mt-1 ml-5 list-disc text-sm">
                {conflicts.map((conflict, index) => (
                  <li key={index}>{conflict}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                Você ainda pode salvar este agendamento, mas estes conflitos precisarão ser resolvidos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
        
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
          {/* Recipe selection */}
          <div className="sm:col-span-2">
            <label htmlFor="recipeId" className="block text-sm font-medium text-gray-700 mb-1">
              Receita *
            </label>
            <select
              id="recipeId"
              name="recipeId"
              className={`select ${validationErrors.recipeId ? 'border-red-300' : ''}`}
              value={formData.recipeId || ''}
              onChange={handleInputChange}
              disabled={!!existingSchedule && existingSchedule.status === 'in-progress'}
            >
              <option value="">Selecione uma receita</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.productName}
                </option>
              ))}
            </select>
            {validationErrors.recipeId && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.recipeId}</p>
            )}
          </div>

          {/* Production quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                step="0.01"
                className={`flex-1 input rounded-r-none ${validationErrors.quantity ? 'border-red-300' : ''}`}
                value={formData.quantity || ''}
                onChange={handleNumberChange}
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                {formData.unit || 'un'}
              </span>
            </div>
            {validationErrors.quantity && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>
            )}
          </div>

          {/* Priority selection */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              id="priority"
              name="priority"
              className="select"
              value={formData.priority || 'normal'}
              onChange={handleInputChange}
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Status selection - only for existing schedules */}
          {existingSchedule && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="select"
                value={formData.status || 'scheduled'}
                onChange={handleInputChange}
              >
                <option value="scheduled">Agendado</option>
                <option value="in-progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Agendamento</h3>
        
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
          {/* Date selection */}
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                className={`input pl-10 ${validationErrors.scheduledDate ? 'border-red-300' : ''}`}
                value={formData.scheduledDate || ''}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.scheduledDate && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.scheduledDate}</p>
            )}
          </div>

          {/* Assigned to */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Atribuir para *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="assignedTo"
                name="assignedTo"
                className={`input pl-10 ${validationErrors.assignedTo ? 'border-red-300' : ''}`}
                value={formData.assignedTo || ''}
                onChange={handleInputChange}
              >
                <option value="">Selecione um recurso</option>
                {resources.map(resource => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.type === 'staff' ? 'Equipe' : 'Equipamento'})
                  </option>
                ))}
              </select>
            </div>
            {validationErrors.assignedTo && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.assignedTo}</p>
            )}
          </div>

          {/* Start time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Início *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                id="startTime"
                name="startTime"
                className={`input pl-10 ${validationErrors.startTime ? 'border-red-300' : ''}`}
                value={formData.startTime || ''}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.startTime && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>
            )}
          </div>

          {/* End time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Término *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                id="endTime"
                name="endTime"
                className={`input pl-10 ${validationErrors.endTime ? 'border-red-300' : ''}`}
                value={formData.endTime || ''}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.endTime && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.endTime}</p>
            )}
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
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
              placeholder="Instruções especiais, requisitos ou comentários..."
            ></textarea>
          </div>
        </div>

        {/* Estimated time display */}
        {formData.recipeId && (
          <div className="mt-4 bg-blue-50 p-3 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Tempo Estimado de Produção</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Com base na receita e quantidade, o tempo estimado de produção é de <strong>{calculateProductionTime()}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="btn-outline py-2 px-4"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </button>

        <button
          type="button"
          className="btn-outline py-2 px-4"
          onClick={() => {
            if (existingSchedule) {
              // Reset to original data
              setFormData({
                id: existingSchedule.id,
                recipeId: existingSchedule.recipeId,
                recipeName: existingSchedule.recipeName,
                productId: existingSchedule.productId,
                quantity: existingSchedule.quantity,
                unit: existingSchedule.unit,
                scheduledDate: new Date(existingSchedule.scheduledDate).toISOString().split('T')[0],
                startTime: existingSchedule.startTime,
                endTime: existingSchedule.endTime,
                priority: existingSchedule.priority,
                status: existingSchedule.status,
                assignedTo: existingSchedule.assignedTo || '',
                notes: existingSchedule.notes || ''
              });
            } else {
              // Reset to initial state
              setFormData({
                recipeId: '',
                recipeName: '',
                productId: '',
                quantity: 0,
                unit: '',
                scheduledDate: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                endTime: '10:00',
                priority: 'normal',
                status: 'scheduled',
                assignedTo: '',
                notes: ''
              });
            }
            
            // Clear errors
            setValidationErrors({});
            setError(null);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar
        </button>

        <button
          type="submit"
          className="btn-primary py-2 px-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {existingSchedule ? 'Atualizar Agendamento' : 'Salvar Agendamento'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductionScheduleForm;