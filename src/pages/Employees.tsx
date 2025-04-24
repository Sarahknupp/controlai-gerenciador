import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  FileText, 
  Award, 
  AlertTriangle,
  DollarSign 
} from 'lucide-react';

const Employees: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'documents' | 'overtime'>('list');
  
  const employees = [
    {
      id: 1,
      name: 'João Silva',
      position: 'Padeiro',
      department: 'Produção',
      hireDate: '10/03/2023',
      salary: 2200,
      status: 'active'
    },
    {
      id: 2,
      name: 'Maria Oliveira',
      position: 'Confeiteira',
      department: 'Produção',
      hireDate: '05/06/2022',
      salary: 2500,
      status: 'active'
    },
    {
      id: 3,
      name: 'Pedro Santos',
      position: 'Atendente',
      department: 'Vendas',
      hireDate: '15/01/2024',
      salary: 1800,
      status: 'active'
    },
    {
      id: 4,
      name: 'Ana Costa',
      position: 'Gerente',
      department: 'Administração',
      hireDate: '20/08/2021',
      salary: 3500,
      status: 'active'
    },
    {
      id: 5,
      name: 'Carlos Gomes',
      position: 'Auxiliar de Limpeza',
      department: 'Serviços Gerais',
      hireDate: '03/11/2023',
      salary: 1600,
      status: 'active'
    },
  ];

  const documents = [
    {
      id: 1,
      employeeName: 'João Silva',
      type: 'payment',
      title: 'Recibo de Pagamento - Abril/2025',
      date: '30/04/2025',
      amount: 2200,
      status: 'issued'
    },
    {
      id: 2,
      employeeName: 'Maria Oliveira',
      type: 'payment',
      title: 'Recibo de Pagamento - Abril/2025',
      date: '30/04/2025',
      amount: 2500,
      status: 'issued'
    },
    {
      id: 3,
      employeeName: 'Pedro Santos',
      type: 'advance',
      title: 'Vale - Adiantamento',
      date: '15/04/2025',
      amount: 900,
      status: 'issued'
    },
    {
      id: 4,
      employeeName: 'Carlos Gomes',
      type: 'warning',
      title: 'Advertência - Atraso',
      date: '12/04/2025',
      description: 'Atraso de 45 minutos sem justificativa',
      status: 'issued'
    },
    {
      id: 5,
      employeeName: 'João Silva',
      type: 'advance',
      title: 'Vale - Adiantamento',
      date: '10/04/2025',
      amount: 800,
      status: 'issued'
    },
  ];

  const overtimeRecords = [
    {
      id: 1,
      employeeName: 'João Silva',
      date: '15/04/2025',
      hoursWorked: 9.5,
      overtimeHours: 1.5,
      value: 24.75,
      status: 'approved'
    },
    {
      id: 2,
      employeeName: 'Maria Oliveira',
      date: '16/04/2025',
      hoursWorked: 10,
      overtimeHours: 2,
      value: 50,
      status: 'approved'
    },
    {
      id: 3,
      employeeName: 'Pedro Santos',
      date: '18/04/2025',
      hoursWorked: 9,
      overtimeHours: 1,
      value: 16.50,
      status: 'pending'
    },
    {
      id: 4,
      employeeName: 'João Silva',
      date: '20/04/2025',
      hoursWorked: 12,
      overtimeHours: 4,
      value: 66,
      status: 'approved'
    },
    {
      id: 5,
      employeeName: 'Maria Oliveira',
      date: '22/04/2025',
      hoursWorked: 11,
      overtimeHours: 3,
      value: 75,
      status: 'pending'
    },
  ];

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'advance':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Ativo</span>;
      case 'inactive':
        return <span className="badge badge-error">Inativo</span>;
      case 'approved':
        return <span className="badge badge-success">Aprovado</span>;
      case 'pending':
        return <span className="badge badge-warning">Pendente</span>;
      case 'issued':
        return <span className="badge badge-success">Emitido</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500">Gerencie funcionários, documentos e horas extras</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lista de Funcionários
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overtime' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Horas Extras
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
              activeTab === 'list' 
                ? 'Buscar funcionário...' 
                : activeTab === 'documents' 
                  ? 'Buscar documento...' 
                  : 'Buscar registro de horas extras...'
            }
          />
        </div>
        <button className="btn-outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
        {activeTab === 'documents' && (
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </button>
        )}
        {activeTab === 'overtime' && (
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Hora Extra
          </button>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' && (
        <div className="table-container animate-slide-in">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Nome</th>
                <th className="table-th">Cargo</th>
                <th className="table-th">Departamento</th>
                <th className="table-th">Data de Contratação</th>
                <th className="table-th">Salário</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="table-row">
                  <td className="table-td font-medium text-gray-900">{employee.name}</td>
                  <td className="table-td">{employee.position}</td>
                  <td className="table-td">{employee.department}</td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {employee.hireDate}
                    </div>
                  </td>
                  <td className="table-td font-medium">R$ {employee.salary.toLocaleString('pt-BR')}</td>
                  <td className="table-td">{getStatusBadge(employee.status)}</td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
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

      {activeTab === 'documents' && (
        <div className="table-container animate-slide-in">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Tipo</th>
                <th className="table-th">Título</th>
                <th className="table-th">Funcionário</th>
                <th className="table-th">Data</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                        {getDocumentTypeIcon(document.type)}
                      </div>
                      <span className="capitalize">
                        {document.type === 'payment' ? 'Recibo' : 
                         document.type === 'advance' ? 'Vale' : 
                         document.type === 'warning' ? 'Advertência' : document.type}
                      </span>
                    </div>
                  </td>
                  <td className="table-td font-medium text-gray-900">{document.title}</td>
                  <td className="table-td">{document.employeeName}</td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {document.date}
                    </div>
                  </td>
                  <td className="table-td font-medium">
                    {document.amount ? `R$ ${document.amount.toLocaleString('pt-BR')}` : '-'}
                  </td>
                  <td className="table-td">{getStatusBadge(document.status)}</td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
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

      {activeTab === 'overtime' && (
        <div className="table-container animate-slide-in">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Funcionário</th>
                <th className="table-th">Data</th>
                <th className="table-th">Horas Trabalhadas</th>
                <th className="table-th">Horas Extras</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overtimeRecords.map((record) => (
                <tr key={record.id} className="table-row">
                  <td className="table-td font-medium text-gray-900">{record.employeeName}</td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {record.date}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {record.hoursWorked}h
                    </div>
                  </td>
                  <td className="table-td font-medium text-blue-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      {record.overtimeHours}h
                    </div>
                  </td>
                  <td className="table-td font-medium">R$ {record.value.toFixed(2)}</td>
                  <td className="table-td">{getStatusBadge(record.status)}</td>
                  <td className="table-td">
                    <div className="flex items-center space-x-2">
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
    </div>
  );
};

export default Employees;