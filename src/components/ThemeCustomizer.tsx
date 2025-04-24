import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Monitor, 
  CheckCircle2, 
  Circle, 
  LayoutGrid, 
  Bookmark, 
  Volume2, 
  VolumeX,
  Type, 
  BellRing, 
  Save,
  RotateCcw
} from 'lucide-react';
import { useUserPreferences, ThemeMode, ColorScheme, FontSize, LayoutMode } from '../contexts/UserPreferencesContext';

interface ThemeCustomizerProps {
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ onClose }) => {
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();
  const [localPreferences, setLocalPreferences] = useState({ ...preferences });
  
  const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'blue', label: 'Azul', color: '#3b82f6' },
    { value: 'green', label: 'Verde', color: '#10b981' },
    { value: 'amber', label: 'Âmbar', color: '#f59e0b' },
    { value: 'purple', label: 'Roxo', color: '#8b5cf6' },
    { value: 'rose', label: 'Rosa', color: '#ec4899' },
  ];
  
  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Pequena' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];
  
  const layoutModes: { value: LayoutMode; label: string; icon: React.ReactNode }[] = [
    { value: 'default', label: 'Padrão', icon: <LayoutGrid className="h-4 w-4" /> },
    { value: 'compact', label: 'Compacta', icon: <LayoutGrid className="h-4 w-4" /> },
    { value: 'comfortable', label: 'Confortável', icon: <LayoutGrid className="h-4 w-4" /> },
  ];
  
  const handleChange = <K extends keyof typeof localPreferences>(
    key: K, 
    value: typeof localPreferences[K]
  ) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = () => {
    // Update all preferences at once
    Object.keys(localPreferences).forEach((key) => {
      const typedKey = key as keyof typeof preferences;
      updatePreference(typedKey, localPreferences[typedKey]);
    });
    
    onClose();
  };
  
  const handleReset = () => {
    resetPreferences();
    setLocalPreferences({ ...preferences });
  };
  
  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-6">Personalização da Interface</h3>
      
      {/* Theme Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Tema</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              localPreferences.theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200'
            }`}
            onClick={() => handleChange('theme', 'light')}
          >
            <Sun className="h-6 w-6 mb-2" />
            <span className="text-sm">Claro</span>
          </button>
          
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              localPreferences.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200'
            }`}
            onClick={() => handleChange('theme', 'dark')}
          >
            <Moon className="h-6 w-6 mb-2" />
            <span className="text-sm">Escuro</span>
          </button>
          
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200`}
            onClick={() => {
              // This would detect system preference in a real implementation
              handleChange('theme', 'light');
            }}
          >
            <Monitor className="h-6 w-6 mb-2" />
            <span className="text-sm">Sistema</span>
          </button>
        </div>
      </div>
      
      {/* Color Scheme */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Esquema de Cores</h4>
        <div className="grid grid-cols-5 gap-3">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.value}
              type="button"
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border ${
                localPreferences.colorScheme === scheme.value ? 'border-primary' : 'border-gray-200'
              }`}
              onClick={() => handleChange('colorScheme', scheme.value)}
            >
              <div 
                className="h-6 w-6 rounded-full mb-2"
                style={{ backgroundColor: scheme.color }}
              />
              <span className="text-xs">{scheme.label}</span>
              
              {localPreferences.colorScheme === scheme.value && (
                <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Font Size */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Tamanho da Fonte</h4>
        <div className="grid grid-cols-3 gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.value}
              type="button"
              className={`flex items-center justify-center p-3 rounded-lg border ${
                localPreferences.fontSize === size.value ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => handleChange('fontSize', size.value)}
            >
              <Type className={`h-4 w-4 mr-2 ${
                size.value === 'small' ? 'h-3 w-3' : 
                size.value === 'large' ? 'h-5 w-5' : 'h-4 w-4'
              }`} />
              <span className="text-sm">{size.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Layout */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Layout</h4>
        <div className="grid grid-cols-3 gap-3">
          {layoutModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                localPreferences.layoutMode === mode.value ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => handleChange('layoutMode', mode.value)}
            >
              <div className="h-6 w-6 mb-2 flex items-center justify-center">
                {mode.icon}
              </div>
              <span className="text-sm">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Other Options */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Outras Opções</h4>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BellRing className="h-5 w-5 mr-3 text-gray-500" />
              <span>Mostrar Atalhos de Teclado</span>
            </div>
            <div 
              className={`relative w-10 h-5 transition-colors duration-200 ease-linear rounded-full cursor-pointer ${
                localPreferences.showShortcuts ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => handleChange('showShortcuts', !localPreferences.showShortcuts)}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-linear transform bg-white rounded-full ${
                  localPreferences.showShortcuts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
          
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              {localPreferences.enableSounds ? (
                <Volume2 className="h-5 w-5 mr-3 text-gray-500" />
              ) : (
                <VolumeX className="h-5 w-5 mr-3 text-gray-500" />
              )}
              <span>Sons de Interface</span>
            </div>
            <div 
              className={`relative w-10 h-5 transition-colors duration-200 ease-linear rounded-full cursor-pointer ${
                localPreferences.enableSounds ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => handleChange('enableSounds', !localPreferences.enableSounds)}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-linear transform bg-white rounded-full ${
                  localPreferences.enableSounds ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
          
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Bookmark className="h-5 w-5 mr-3 text-gray-500" />
              <span>Alto Contraste</span>
            </div>
            <div 
              className={`relative w-10 h-5 transition-colors duration-200 ease-linear rounded-full cursor-pointer ${
                localPreferences.highContrast ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => handleChange('highContrast', !localPreferences.highContrast)}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-linear transform bg-white rounded-full ${
                  localPreferences.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
          
          <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <LayoutGrid className="h-5 w-5 mr-3 text-gray-500" />
              <span>Modo Mesa (PDV)</span>
            </div>
            <div 
              className={`relative w-10 h-5 transition-colors duration-200 ease-linear rounded-full cursor-pointer ${
                localPreferences.tableMode ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => handleChange('tableMode', !localPreferences.tableMode)}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-linear transform bg-white rounded-full ${
                  localPreferences.tableMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          className="btn-outline py-2 px-4 flex items-center"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </button>
        
        <div className="space-x-3">
          <button
            type="button"
            className="btn-outline py-2 px-4"
            onClick={onClose}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            className="btn-primary py-2 px-4 flex items-center"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;