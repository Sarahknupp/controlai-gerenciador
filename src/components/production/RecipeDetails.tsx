import React, { useState } from 'react';
import { 
  Clock, 
  FileText, 
  Utensils, 
  Edit, 
  Printer, 
  Download, 
  CalendarDays,
  Calendar, 
  BarChart, 
  History, 
  ChevronDown, 
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { Recipe, RecipeVersion } from '../../types/production';

interface RecipeDetailsProps {
  recipe: Recipe;
  onEdit: () => void;
  onBack: () => void;
  onScheduleProduction?: () => void;
  onPrintRecipe?: () => void;
}

const RecipeDetails: React.FC<RecipeDetailsProps> = ({
  recipe,
  onEdit,
  onBack,
  onScheduleProduction,
  onPrintRecipe
}) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'versions' | 'history'>('recipe');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<RecipeVersion | null>(null);

  // Format time for display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Voltar para lista</span>
        </button>
        
        <div className="flex items-center space-x-3">
          {onPrintRecipe && (
            <button className="btn-outline py-2" onClick={onPrintRecipe}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          )}
          
          {onScheduleProduction && (
            <button className="btn-primary py-2" onClick={onScheduleProduction}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Agendar Produção
            </button>
          )}
          
          <button className="btn-primary py-2" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Receita
          </button>
        </div>
      </div>

      {/* Recipe title and badges */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{recipe.productName}</h1>
            <p className="text-gray-600 mt-1">{recipe.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(recipe.totalTime)}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Utensils className="h-3 w-3 mr-1" />
                Rend: {recipe.currentVersion.yield} {recipe.currentVersion.yieldUnit}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(recipe.updatedAt).toLocaleDateString('pt-BR')}
              </span>
              
              {recipe.tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <p className="text-sm text-gray-500">Custo por unidade</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(recipe.currentVersion.ingredientsSnapshot.reduce((sum, ing) => sum + ing.totalCost, 0) / recipe.currentVersion.yield)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('recipe')}
            className={`${
              activeTab === 'recipe'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Utensils className="h-4 w-4 inline mr-2" />
            Receita
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`${
              activeTab === 'versions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Versões
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <BarChart className="h-4 w-4 inline mr-2" />
            Histórico de Produção
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'recipe' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ingredientes</h3>
              <div className="space-y-2">
                {recipe.currentVersion.ingredientsSnapshot.map((ingredient, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ingredient.productName}</p>
                      <p className="text-sm text-gray-500">{ingredient.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {ingredient.quantity} {ingredient.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ingredient.totalCost)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">Custo total:</p>
                    <p className="font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(recipe.currentVersion.ingredientsSnapshot.reduce((sum, ing) => sum + ing.totalCost, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modo de Preparo</h3>
              <div className="space-y-6">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-gray-800">{instruction}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional notes or tips */}
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Tempos</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {recipe.prepTime > 0 && (
                    <div>
                      <p className="text-sm text-blue-700">Preparo:</p>
                      <p className="text-sm font-medium text-blue-900">
                        {formatTime(recipe.prepTime)}
                      </p>
                    </div>
                  )}
                  {recipe.cookTime > 0 && (
                    <div>
                      <p className="text-sm text-blue-700">Cozimento:</p>
                      <p className="text-sm font-medium text-blue-900">
                        {formatTime(recipe.cookTime)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-blue-700">Total:</p>
                    <p className="text-sm font-medium text-blue-900">
                      {formatTime(recipe.totalTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Versões</h3>
          
          <div>
            <div 
              className="flex justify-between items-center border rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-50 bg-primary/5 border-primary"
              onClick={() => {
                setSelectedVersion(recipe.currentVersion);
                setShowVersionHistory(!showVersionHistory);
              }}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <div>
                  <p className="font-medium text-gray-900">
                    Versão atual ({recipe.currentVersion.versionNumber})
                  </p>
                  <p className="text-sm text-gray-500">
                    Criada em {new Date(recipe.currentVersion.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                  Ativa
                </span>
                {showVersionHistory && selectedVersion?.versionNumber === recipe.currentVersion.versionNumber ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {recipe.versions && recipe.versions.map((version) => (
              version.versionNumber !== recipe.currentVersion.versionNumber && (
                <div 
                  key={version.versionNumber}
                  className="flex justify-between items-center border rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedVersion(version);
                    setShowVersionHistory(!showVersionHistory);
                  }}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Versão {version.versionNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        Criada em {new Date(version.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {!version.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                        Inativa
                      </span>
                    )}
                    {showVersionHistory && selectedVersion?.versionNumber === version.versionNumber ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              )
            ))}

            {/* Version details */}
            {showVersionHistory && selectedVersion && (
              <div className="border rounded-lg p-4 mt-4 bg-gray-50 animate-slide-up">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Detalhes da Versão {selectedVersion.versionNumber}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ingredientes</h5>
                    <div className="space-y-2">
                      {selectedVersion.ingredientsSnapshot.map((ingredient, index) => (
                        <div key={index} className="flex justify-between py-1 text-sm border-b border-gray-100 last:border-0">
                          <span>{ingredient.productName}</span>
                          <span className="font-medium">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        </div>
                      ))}

                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <p className="font-medium text-sm">Custo total:</p>
                          <p className="font-bold text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                              .format(selectedVersion.ingredientsSnapshot.reduce((sum, ing) => sum + ing.totalCost, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Informações</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span>Rendimento:</span>
                        <span className="font-medium">
                          {selectedVersion.yield} {selectedVersion.yieldUnit}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span>Custo por unidade:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            selectedVersion.ingredientsSnapshot.reduce((sum, ing) => sum + ing.totalCost, 0) / selectedVersion.yield
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span>Data de criação:</span>
                        <span className="font-medium">
                          {new Date(selectedVersion.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span>Criado por:</span>
                        <span className="font-medium">
                          {selectedVersion.createdBy}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1">
                        <span>Status:</span>
                        <span className={`font-medium ${selectedVersion.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedVersion.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  {selectedVersion.versionNumber !== recipe.currentVersion.versionNumber && (
                    <button 
                      className="btn-outline py-1.5 text-sm"
                      onClick={() => alert('Esta funcionalidade restauraria esta versão como a versão atual.')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Restaurar esta versão
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Produção</h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">Estatísticas de Produção</h4>
              <div className="flex space-x-2">
                <select className="select text-sm py-1 px-2">
                  <option value="1month">Último mês</option>
                  <option value="3months">Últimos 3 meses</option>
                  <option value="6months">Últimos 6 meses</option>
                  <option value="1year">Último ano</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 text-sm">Total produzido</p>
                <p className="text-2xl font-bold text-blue-900">532 un</p>
                <p className="text-xs text-blue-600 mt-1">Últimos 30 dias</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-700 text-sm">Eficiência média</p>
                <p className="text-2xl font-bold text-green-900">97.2%</p>
                <p className="text-xs text-green-600 mt-1">Últimos 30 dias</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-purple-700 text-sm">Tempo médio</p>
                <p className="text-2xl font-bold text-purple-900">48 min</p>
                <p className="text-xs text-purple-600 mt-1">Por lote produzido</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-3">Produção Recente</h4>
            {/* Tabela de produção recente */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15/05/2025</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">BL-2025051501</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">50 un</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">João Silva</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Concluído
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">12/05/2025</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">BL-2025051201</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">100 un</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Maria Oliveira</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Concluído
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">08/05/2025</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">BL-2025050801</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">75 un</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">João Silva</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Concluído
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Exibir gráfico de produção */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">Tendência de Produção</h4>
              <button className="text-sm text-primary hover:text-primary-dark">
                <Download className="h-4 w-4 inline mr-1" />
                Exportar Dados
              </button>
            </div>
            
            <div className="h-60 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de tendência de produção estará disponível aqui</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetails;