import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Utensils,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  CheckCircle,
  Layers
} from 'lucide-react';

const Production: React.FC = () => {
  const [expandedRecipes, setExpandedRecipes] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'schedule' | 'production'>('recipes');
  
  const recipes = [
    {
      id: 1,
      name: 'Pão Francês',
      category: 'Pães',
      yield: '50 unidades',
      prepTime: '2h 30min',
      lastProduced: '15/05/2025',
      status: 'active',
      ingredients: [
        { id: 1, name: 'Farinha de Trigo', quantity: 1, unit: 'kg' },
        { id: 2, name: 'Água', quantity: 600, unit: 'ml' },
        { id: 3, name: 'Sal', quantity: 20, unit: 'g' },
        { id: 4, name: 'Fermento', quantity: 10, unit: 'g' },
        { id: 5, name: 'Açúcar', quantity: 5, unit: 'g' },
      ],
      steps: [
        'Misturar todos os ingredientes secos',
        'Adicionar água gradualmente',
        'Sovar por 10 minutos',
        'Deixar descansar por 1 hora',
        'Modelar os pães',
        'Deixar crescer por 30 minutos',
        'Assar a 220°C por 20 minutos'
      ]
    },
    {
      id: 2,
      name: 'Bolo de Chocolate',
      category: 'Bolos',
      yield: '1 unidade (20 fatias)',
      prepTime: '1h 30min',
      lastProduced: '14/05/2025',
      status: 'active',
      ingredients: [
        { id: 6, name: 'Farinha de Trigo', quantity: 300, unit: 'g' },
        { id: 7, name: 'Chocolate em Pó', quantity: 100, unit: 'g' },
        { id: 8, name: 'Açúcar', quantity: 250, unit: 'g' },
        { id: 9, name: 'Ovos', quantity: 4, unit: 'un' },
        { id: 10, name: 'Leite', quantity: 240, unit: 'ml' },
        { id: 11, name: 'Óleo', quantity: 120, unit: 'ml' },
        { id: 12, name: 'Fermento em Pó', quantity: 10, unit: 'g' },
      ],
      steps: [
        'Pré-aquecer o forno a 180°C',
        'Misturar os ingredientes secos',
        'Em uma tigela separada, bater os ovos e adicionar leite e óleo',
        'Adicionar gradualmente os ingredientes secos na mistura líquida',
        'Untar a forma e despejar a massa',
        'Assar por aproximadamente 40 minutos'
      ]
    },
    {
      id: 3,
      name: 'Pão de Queijo',
      category: 'Pães',
      yield: '30 unidades',
      prepTime: '1h',
      lastProduced: '13/05/2025',
      status: 'active',
      ingredients: [
        { id: 13, name: 'Polvilho Azedo', quantity: 250, unit: 'g' },
        { id: 14, name: 'Polvilho Doce', quantity: 250, unit: 'g' },
        { id: 15, name: 'Leite', quantity: 240, unit: 'ml' },
        { id: 16, name: 'Óleo', quantity: 120, unit: 'ml' },
        { id: 17, name: 'Ovos', quantity: 2, unit: 'un' },
        { id: 18, name: 'Queijo Meia Cura', quantity: 200, unit: 'g' },
        { id: 19, name: 'Sal', quantity: 10, unit: 'g' },
      ],
      steps: [
        'Ferver o leite com o óleo e o sal',
        'Escaldar os polvilhos com a mistura quente',
        'Depois de esfriar um pouco, adicionar os ovos e o queijo ralado',
        'Amassar bem até formar uma massa homogênea',
        'Modelar bolinhas',
        'Assar em forno pré-aquecido a 180°C por 20-25 minutos'
      ]
    },
  ];

  const productionSchedule = [
    {
      id: 1,
      recipeName: 'Pão Francês',
      date: '16/05/2025',
      startTime: '04:00',
      quantity: '150 unidades',
      status: 'scheduled',
      assignedTo: 'João Silva'
    },
    {
      id: 2,
      recipeName: 'Bolo de Chocolate',
      date: '16/05/2025',
      startTime: '06:00',
      quantity: '5 unidades',
      status: 'scheduled',
      assignedTo: 'Maria Oliveira'
    },
    {
      id: 3,
      recipeName: 'Pão de Queijo',
      date: '16/05/2025',
      startTime: '08:00',
      quantity: '90 unidades',
      status: 'scheduled',
      assignedTo: 'João Silva'
    },
    {
      id: 4,
      recipeName: 'Pão Francês',
      date: '17/05/2025',
      startTime: '04:00',
      quantity: '150 unidades',
      status: 'scheduled',
      assignedTo: 'João Silva'
    },
  ];

  const productionRuns = [
    {
      id: 1,
      recipeName: 'Pão Francês',
      date: '15/05/2025',
      startTime: '04:00',
      endTime: '06:30',
      quantity: '150 unidades',
      status: 'completed',
      assignedTo: 'João Silva'
    },
    {
      id: 2,
      recipeName: 'Bolo de Chocolate',
      date: '15/05/2025',
      startTime: '06:00',
      endTime: '07:30',
      quantity: '5 unidades',
      status: 'completed',
      assignedTo: 'Maria Oliveira'
    },
    {
      id: 3,
      recipeName: 'Pão de Queijo',
      date: '15/05/2025',
      startTime: '08:00',
      endTime: '09:00',
      quantity: '90 unidades',
      status: 'completed',
      assignedTo: 'João Silva'
    },
    {
      id: 4,
      recipeName: 'Sonho',
      date: '14/05/2025',
      startTime: '07:00',
      endTime: '09:00',
      quantity: '60 unidades',
      status: 'completed',
      assignedTo: 'Maria Oliveira'
    },
  ];

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipes(current => 
      current.includes(recipeId)
        ? current.filter(id => id !== recipeId)
        : [...current, recipeId]
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-error';
      case 'scheduled':
        return 'bg-blue-100 text-blue-600';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-600';
      case 'completed':
        return 'badge-success';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
          <p className="text-gray-500">Gerenciamento de receitas e produção</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'recipes' ? 'Nova Receita' : 
           activeTab === 'schedule' ? 'Agendar Produção' : 
           'Registrar Produção'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recipes' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agendamento
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Histórico de Produção
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder={
              activeTab === 'recipes' 
                ? 'Buscar receita...' 
                : activeTab === 'schedule' 
                  ? 'Buscar agendamento...' 
                  : 'Buscar produção...'
            }
          />
        </div>
        <button className="btn-outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
        {activeTab === 'recipes' && (
          <button className="btn-outline">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar
          </button>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {recipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleRecipe(recipe.id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="mr-3">{recipe.category}</span>
                      <span className="mx-3">Rendimento: {recipe.yield}</span>
                      <div className="flex items-center ml-3">
                        <Clock className="h-4 w-4 mr-1" />
                        {recipe.prepTime}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`badge ${getStatusBadgeClass(recipe.status)} mr-4`}>
                    {recipe.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded mr-2">
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded mr-2">
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </button>
                  {expandedRecipes.includes(recipe.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {expandedRecipes.includes(recipe.id) && (
                <div className="border-t border-gray-200 p-4 animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Ingredientes</h4>
                      <ul className="space-y-2">
                        {recipe.ingredients.map(ingredient => (
                          <li key={ingredient.id} className="flex justify-between">
                            <span className="text-gray-700">{ingredient.name}</span>
                            <span className="text-gray-900 font-medium">
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Modo de Preparo</h4>
                      <ol className="space-y-2 list-decimal list-inside">
                        {recipe.steps.map((step, index) => (
                          <li key={index} className="text-gray-700">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <button className="btn-outline">
                      <Layers className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </button>
                    <button className="btn-primary">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Iniciar Produção
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="table-container animate-slide-in">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Receita</th>
                <th className="table-th">Data</th>
                <th className="table-th">Hora</th>
                <th className="table-th">Quantidade</th>
                <th className="table-th">Responsável</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productionSchedule.map((schedule) => (
                <tr key={schedule.id} className="table-row">
                  <td className="table-td font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                        <Utensils className="h-4 w-4 text-primary" />
                      </div>
                      {schedule.recipeName}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {schedule.date}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {schedule.startTime}
                    </div>
                  </td>
                  <td className="table-td">{schedule.quantity}</td>
                  <td className="table-td">{schedule.assignedTo}</td>
                  <td className="table-td">
                    <span className={`badge ${getStatusBadgeClass(schedule.status)}`}>
                      {schedule.status === 'scheduled' ? 'Agendado' : 
                       schedule.status === 'in-progress' ? 'Em Andamento' : 
                       schedule.status === 'completed' ? 'Concluído' : schedule.status}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <PlayCircle className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="table-container animate-slide-in">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Receita</th>
                <th className="table-th">Data</th>
                <th className="table-th">Horário</th>
                <th className="table-th">Quantidade</th>
                <th className="table-th">Responsável</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productionRuns.map((run) => (
                <tr key={run.id} className="table-row">
                  <td className="table-td font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                        <Utensils className="h-4 w-4 text-primary" />
                      </div>
                      {run.recipeName}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {run.date}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {run.startTime} - {run.endTime}
                    </div>
                  </td>
                  <td className="table-td">{run.quantity}</td>
                  <td className="table-td">{run.assignedTo}</td>
                  <td className="table-td">
                    <span className={`badge ${getStatusBadgeClass(run.status)}`}>
                      {run.status === 'scheduled' ? 'Agendado' : 
                       run.status === 'in-progress' ? 'Em Andamento' : 
                       run.status === 'completed' ? 'Concluído' : run.status}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Production;