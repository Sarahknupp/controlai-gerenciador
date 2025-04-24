import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Utensils, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw,
  AlertTriangle,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react';
import { Recipe, Ingredient, RecipeVersion } from '../../types/production';

interface RecipeFormProps {
  existingRecipe?: Recipe;
  productId: string;
  productName: string;
  productType?: 'resale' | 'own_production' | 'raw_material';
  onSave: (recipe: Partial<Recipe>) => Promise<void>;
  onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  existingRecipe,
  productId,
  productName,
  productType = 'own_production',
  onSave,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state
  const [recipeData, setRecipeData] = useState<Partial<Recipe>>({
    productId,
    productName,
    description: '',
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    difficulty: 'medium',
    instructions: [''],
    tags: []
  });

  const [currentVersionData, setCurrentVersionData] = useState<Partial<RecipeVersion>>({
    ingredients: [],
    yield: 1,
    yieldUnit: 'un'
  });

  const [ingredients, setIngredients] = useState<Partial<Ingredient>[]>([
    { productId: '', productName: '', quantity: 0, unit: 'g', costPerUnit: 0, totalCost: 0 }
  ]);

  // Available products for ingredients
  const [availableProducts, setAvailableProducts] = useState<{ id: string, name: string, unit: string, costPerUnit: number }[]>([
    { id: 'prod1', name: 'Farinha de Trigo', unit: 'kg', costPerUnit: 4.50 },
    { id: 'prod2', name: 'Açúcar', unit: 'kg', costPerUnit: 5.20 },
    { id: 'prod3', name: 'Leite', unit: 'l', costPerUnit: 4.80 },
    { id: 'prod4', name: 'Fermento', unit: 'g', costPerUnit: 0.20 },
    { id: 'prod5', name: 'Ovos', unit: 'un', costPerUnit: 0.75 },
    { id: 'prod6', name: 'Chocolate em Pó', unit: 'kg', costPerUnit: 18.90 },
    { id: 'prod7', name: 'Manteiga', unit: 'kg', costPerUnit: 32.50 },
  ]);

  // Initialize form with existing recipe data
  useEffect(() => {
    if (existingRecipe) {
      setRecipeData({
        id: existingRecipe.id,
        productId: existingRecipe.productId,
        productName: existingRecipe.productName,
        description: existingRecipe.description,
        prepTime: existingRecipe.prepTime,
        cookTime: existingRecipe.cookTime,
        totalTime: existingRecipe.totalTime,
        difficulty: existingRecipe.difficulty,
        instructions: [...existingRecipe.instructions],
        tags: [...existingRecipe.tags]
      });

      if (existingRecipe.currentVersion) {
        setCurrentVersionData({
          versionNumber: existingRecipe.currentVersion.versionNumber + 1,
          yield: existingRecipe.currentVersion.yield,
          yieldUnit: existingRecipe.currentVersion.yieldUnit
        });
        
        setIngredients(existingRecipe.currentVersion.ingredientsSnapshot.map(ingredient => ({
          productId: ingredient.productId,
          productName: ingredient.productName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
          totalCost: ingredient.totalCost,
          notes: ingredient.notes
        })));
      }
    }
  }, [existingRecipe]);

  // Update total time when prep or cook time changes
  useEffect(() => {
    setRecipeData(prev => ({
      ...prev,
      totalTime: (prev.prepTime || 0) + (prev.cookTime || 0)
    }));
  }, [recipeData.prepTime, recipeData.cookTime]);

  // Update total cost when quantity or ingredient changes
  const updateIngredientCosts = (index: number, ingredient: Partial<Ingredient>) => {
    const quantity = ingredient.quantity || 0;
    const costPerUnit = ingredient.costPerUnit || 0;
    const totalCost = quantity * costPerUnit;

    const updatedIngredient = {
      ...ingredient,
      totalCost
    };

    const newIngredients = [...ingredients];
    newIngredients[index] = updatedIngredient;
    setIngredients(newIngredients);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'currentVersion') {
        setCurrentVersionData(prev => ({
          ...prev,
          [child]: value
        }));
      }
    } else {
      setRecipeData(prev => ({
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

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'currentVersion') {
        setCurrentVersionData(prev => ({
          ...prev,
          [child]: isNaN(numValue) ? 0 : numValue
        }));
      }
    } else {
      setRecipeData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    }
  };

  // Handle ingredient changes
  const handleIngredientChange = (index: number, field: string, value: string | number) => {
    const updatedIngredients = [...ingredients];
    
    if (field === 'productId' && typeof value === 'string') {
      const selectedProduct = availableProducts.find(p => p.id === value);
      if (selectedProduct) {
        updatedIngredients[index] = {
          ...updatedIngredients[index],
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          costPerUnit: selectedProduct.costPerUnit
        };
      }
    } else {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      };
    }

    setIngredients(updatedIngredients);

    // Update cost calculations
    updateIngredientCosts(index, updatedIngredients[index]);
  };

  // Add new ingredient row
  const addIngredient = () => {
    setIngredients([...ingredients, { productId: '', productName: '', quantity: 0, unit: 'g', costPerUnit: 0, totalCost: 0 }]);
  };

  // Remove ingredient row
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = [...ingredients];
      newIngredients.splice(index, 1);
      setIngredients(newIngredients);
    }
  };

  // Add new instruction step
  const addInstruction = () => {
    setRecipeData(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), '']
    }));
  };

  // Update instruction step
  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...(recipeData.instructions || [])];
    updatedInstructions[index] = value;
    setRecipeData(prev => ({
      ...prev,
      instructions: updatedInstructions
    }));
  };

  // Remove instruction step
  const removeInstruction = (index: number) => {
    const updatedInstructions = [...(recipeData.instructions || [])];
    updatedInstructions.splice(index, 1);
    setRecipeData(prev => ({
      ...prev,
      instructions: updatedInstructions
    }));
  };

  // Handle tags input
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsValue = e.target.value;
    const tagsArray = tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag);
    setRecipeData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Check required fields
    if (!recipeData.description) {
      errors.description = 'Descrição é obrigatória';
    }

    if (!recipeData.prepTime && !recipeData.cookTime) {
      errors.prepTime = 'Pelo menos um dos tempos deve ser preenchido';
    }

    if (!currentVersionData.yield) {
      errors['currentVersion.yield'] = 'Rendimento é obrigatório';
    }

    if (!currentVersionData.yieldUnit) {
      errors['currentVersion.yieldUnit'] = 'Unidade de rendimento é obrigatória';
    }

    // Check if at least one valid ingredient exists
    const validIngredients = ingredients.filter(ing => 
      ing.productId && ing.quantity && (ing.quantity > 0)
    );

    if (validIngredients.length === 0) {
      errors.ingredients = 'Adicione pelo menos um ingrediente válido';
    }

    // Check if instructions exist
    const validInstructions = recipeData.instructions?.filter(ins => ins.trim());
    if (!validInstructions || validInstructions.length === 0) {
      errors.instructions = 'Adicione pelo menos uma instrução';
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
      // Create recipe version object
      const recipeVersion: Partial<RecipeVersion> = {
        ...currentVersionData,
        ingredientsSnapshot: ingredients as Ingredient[],
        versionNumber: existingRecipe?.currentVersion?.versionNumber 
          ? existingRecipe.currentVersion.versionNumber + 1 
          : 1,
        isActive: true,
        createdAt: new Date()
      };

      // Create complete recipe data
      const completeRecipeData: Partial<Recipe> = {
        ...recipeData,
        currentVersion: recipeVersion as RecipeVersion
      };

      // Save recipe
      await onSave(completeRecipeData);
    } catch (err) {
      console.error("Error saving recipe:", err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a receita');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total cost of all ingredients
  const totalIngredientsCost = ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);

  // Calculate cost per unit of final product
  const costPerUnit = currentVersionData.yield && currentVersionData.yield > 0 
    ? totalIngredientsCost / currentVersionData.yield 
    : 0;

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

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
        
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
          <div className="sm:col-span-2">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
              Produto
            </label>
            <input
              type="text"
              id="productName"
              value={recipeData.productName}
              className="input bg-gray-100"
              disabled
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Receita *
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className={`input ${validationErrors.description ? 'border-red-300' : ''}`}
              value={recipeData.description || ''}
              onChange={handleInputChange}
              placeholder="Descreva brevemente esta receita"
            ></textarea>
            {validationErrors.description && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo de Preparo (min) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="prepTime"
                name="prepTime"
                min="0"
                className={`input pl-10 ${validationErrors.prepTime ? 'border-red-300' : ''}`}
                value={recipeData.prepTime || ''}
                onChange={handleNumberChange}
              />
            </div>
            {validationErrors.prepTime && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.prepTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo de Cozimento (min)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="cookTime"
                name="cookTime"
                min="0"
                className="input pl-10"
                value={recipeData.cookTime || ''}
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="totalTime" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Total (min)
            </label>
            <input
              type="number"
              id="totalTime"
              name="totalTime"
              className="input bg-gray-100"
              value={recipeData.totalTime || 0}
              disabled
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Dificuldade
            </label>
            <select
              id="difficulty"
              name="difficulty"
              className="select"
              value={recipeData.difficulty || 'medium'}
              onChange={handleInputChange}
            >
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Yield and Cost */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rendimento e Custo</h3>
        
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
          <div>
            <label htmlFor="yield" className="block text-sm font-medium text-gray-700 mb-1">
              Rendimento *
            </label>
            <input
              type="number"
              id="yield"
              name="currentVersion.yield"
              min="0"
              step="0.01"
              className={`input ${validationErrors['currentVersion.yield'] ? 'border-red-300' : ''}`}
              value={currentVersionData.yield || ''}
              onChange={handleNumberChange}
            />
            {validationErrors['currentVersion.yield'] && (
              <p className="text-red-500 text-xs mt-1">{validationErrors['currentVersion.yield']}</p>
            )}
          </div>

          <div>
            <label htmlFor="yieldUnit" className="block text-sm font-medium text-gray-700 mb-1">
              Unidade de Rendimento *
            </label>
            <select
              id="yieldUnit"
              name="currentVersion.yieldUnit"
              className={`select ${validationErrors['currentVersion.yieldUnit'] ? 'border-red-300' : ''}`}
              value={currentVersionData.yieldUnit || ''}
              onChange={handleInputChange}
            >
              <option value="">Selecione uma unidade</option>
              <option value="un">Unidades</option>
              <option value="kg">Quilogramas (kg)</option>
              <option value="g">Gramas (g)</option>
              <option value="l">Litros (l)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="porções">Porções</option>
            </select>
            {validationErrors['currentVersion.yieldUnit'] && (
              <p className="text-red-500 text-xs mt-1">{validationErrors['currentVersion.yieldUnit']}</p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1">Custo Total dos Ingredientes</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIngredientsCost)}
            </p>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1">Custo por Unidade</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costPerUnit)}
            </p>
          </div>
        </div>

        {currentVersionData.versionNumber && (
          <div className="mt-4 bg-blue-50 p-3 rounded-md text-blue-800 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">
                {existingRecipe ? `Criando versão ${currentVersionData.versionNumber}` : 'Nova receita'}
              </span>
            </div>
            {existingRecipe && (
              <p className="mt-1">
                Versão atual: {existingRecipe.currentVersion.versionNumber} 
                (criada em {new Date(existingRecipe.currentVersion.createdAt).toLocaleDateString('pt-BR')})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ingredientes</h3>
          <button
            type="button"
            className="btn-outline py-1 px-3 text-sm"
            onClick={addIngredient}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ingrediente
          </button>
        </div>

        {validationErrors.ingredients && (
          <div className="mb-4 bg-red-50 p-3 rounded-md text-red-800 text-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{validationErrors.ingredients}</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Total</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredients.map((ingredient, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <select
                      className="select text-sm py-1"
                      value={ingredient.productId || ''}
                      onChange={(e) => handleIngredientChange(index, 'productId', e.target.value)}
                    >
                      <option value="">Selecione um ingrediente</option>
                      {availableProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input text-sm py-1 w-24"
                      value={ingredient.quantity || ''}
                      onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="input text-sm py-1 w-16"
                      value={ingredient.unit || ''}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input text-sm py-1 w-24"
                      value={ingredient.costPerUnit || ''}
                      onChange={(e) => handleIngredientChange(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ingredient.totalCost || 0)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Modo de Preparo</h3>
          <button
            type="button"
            className="btn-outline py-1 px-3 text-sm"
            onClick={addInstruction}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Passo
          </button>
        </div>

        {validationErrors.instructions && (
          <div className="mb-4 bg-red-50 p-3 rounded-md text-red-800 text-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{validationErrors.instructions}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {recipeData.instructions?.map((instruction, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-2">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>
              <div className="flex-grow">
                <textarea
                  className="input w-full"
                  rows={2}
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={`Passo ${index + 1}`}
                ></textarea>
              </div>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 mt-2"
                onClick={() => removeInstruction(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="input"
              value={recipeData.tags?.join(', ') || ''}
              onChange={handleTagsChange}
              placeholder="Ex: rápido, fácil, sobremesa, vegano"
            />
            <p className="text-sm text-gray-500 mt-1">
              Adicione tags para facilitar a busca da receita posteriormente.
            </p>
          </div>
        </div>
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
            if (existingRecipe) {
              // Reset to original recipe data
              setRecipeData({
                id: existingRecipe.id,
                productId: existingRecipe.productId,
                productName: existingRecipe.productName,
                description: existingRecipe.description,
                prepTime: existingRecipe.prepTime,
                cookTime: existingRecipe.cookTime,
                totalTime: existingRecipe.totalTime,
                difficulty: existingRecipe.difficulty,
                instructions: [...existingRecipe.instructions],
                tags: [...existingRecipe.tags]
              });

              if (existingRecipe.currentVersion) {
                setCurrentVersionData({
                  versionNumber: existingRecipe.currentVersion.versionNumber + 1,
                  yield: existingRecipe.currentVersion.yield,
                  yieldUnit: existingRecipe.currentVersion.yieldUnit
                });
                
                setIngredients(existingRecipe.currentVersion.ingredientsSnapshot.map(ingredient => ({
                  productId: ingredient.productId,
                  productName: ingredient.productName,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  costPerUnit: ingredient.costPerUnit,
                  totalCost: ingredient.totalCost,
                  notes: ingredient.notes
                })));
              }
            } else {
              // Reset to initial state
              setRecipeData({
                productId,
                productName,
                description: '',
                prepTime: 0,
                cookTime: 0,
                totalTime: 0,
                difficulty: 'medium',
                instructions: [''],
                tags: []
              });

              setCurrentVersionData({
                yield: 1,
                yieldUnit: 'un'
              });

              setIngredients([
                { productId: '', productName: '', quantity: 0, unit: 'g', costPerUnit: 0, totalCost: 0 }
              ]);
            }
            
            // Clear errors
            setValidationErrors({});
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
              {existingRecipe ? 'Atualizar Receita' : 'Salvar Receita'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;