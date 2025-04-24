import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search */}
            <div className="ml-4 lg:ml-0">
              <div className="relative max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="Buscar..."
                />
              </div>
            </div>
          </div>
          
          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <button className="text-gray-500 hover:text-primary relative">
              <Bell className="h-6 w-6" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 transform translate-x-1 -translate-y-1"></span>
            </button>
            
            {/* Date display */}
            <div className="hidden md:block text-sm text-gray-600">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;