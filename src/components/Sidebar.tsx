import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, 
  LayoutDashboard, 
  DollarSign, 
  WalletCards, 
  Users, 
  Package, 
  ShoppingCart, 
  Factory, 
  Truck, 
  X,
  Calculator,
  Store,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  Zap,
  FileUp,
  ScanLine
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 lg:py-6">
            <NavLink to="/" className="flex items-center space-x-2">
              <BarChart2 size={28} className="text-primary" />
              <span className="text-xl font-bold text-gray-900">Controlaí</span>
            </NavLink>
            <button 
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-gray-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <NavLink 
              to="/" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/debts" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <DollarSign className="mr-3 h-5 w-5" />
              <span>Painel Financeiro</span>
            </NavLink>
            
            <NavLink 
              to="/cashflow" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <WalletCards className="mr-3 h-5 w-5" />
              <span>Fluxo de Caixa</span>
            </NavLink>
            
            <NavLink 
              to="/employees" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users className="mr-3 h-5 w-5" />
              <span>Funcionários</span>
            </NavLink>
            
            <NavLink 
              to="/unified-inventory" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Package className="mr-3 h-5 w-5" />
              <span>Controle de Estoque</span>
            </NavLink>

            <NavLink 
              to="/suppliers" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Truck className="mr-3 h-5 w-5" />
              <span>Fornecedores</span>
            </NavLink>
            
            <NavLink 
              to="/sales" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Store className="mr-3 h-5 w-5" />
              <span>Vendas</span>
            </NavLink>
            
            {/* PDV Menu Group */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Ponto de Venda (PDV)
              </h3>
              
              <NavLink 
                to="/pdv-modern" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LayoutGrid className="mr-3 h-5 w-5" />
                <span>PDV Moderno</span>
              </NavLink>

              <NavLink 
                to="/modern-checkout" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ShoppingCart className="mr-3 h-5 w-5" />
                <span>Checkout</span>
              </NavLink>
              
              <NavLink 
                to="/sales/fiscal" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <FileText className="mr-3 h-5 w-5" />
                <span>Documentos Fiscais</span>
              </NavLink>
              
              <NavLink 
                to="/payment-demo" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <DollarSign className="mr-3 h-5 w-5" />
                <span>Pagamentos</span>
              </NavLink>
            </div>

            {/* Automation Menu Group */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Automação e Integração
              </h3>
              
              <NavLink 
                to="/sales/automation" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Zap className="mr-3 h-5 w-5" />
                <span>Central de Automação</span>
              </NavLink>
              
              <NavLink 
                to="/sales/document-importer" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <FileUp className="mr-3 h-5 w-5" />
                <span>Importação de XMLs</span>
              </NavLink>
              
              <NavLink 
                to="/sales/ocr-processor" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ScanLine className="mr-3 h-5 w-5" />
                <span>Processamento OCR</span>
              </NavLink>
            </div>
            
            <NavLink 
              to="/reports" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <BarChart2 className="mr-3 h-5 w-5" />
              <span>Relatórios</span>
            </NavLink>
            
            <NavLink 
              to="/production" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Factory className="mr-3 h-5 w-5" />
              <span>Produção</span>
            </NavLink>

            <NavLink 
              to="/accountant" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Calculator className="mr-3 h-5 w-5" />
              <span>Painel do Contador</span>
            </NavLink>
          </nav>
          
          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                CI
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Controlaí</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;