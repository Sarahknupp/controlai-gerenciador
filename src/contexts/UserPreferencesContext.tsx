import React, { createContext, useContext, useEffect, useState } from 'react';

// Define preference types
export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'blue' | 'green' | 'amber' | 'purple' | 'rose';
export type FontSize = 'small' | 'normal' | 'large';
export type LayoutMode = 'default' | 'compact' | 'comfortable';

export interface UserPreferences {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  highContrast: boolean;
  layoutMode: LayoutMode;
  showShortcuts: boolean;
  enableSounds: boolean;
  tableMode: boolean; // For PDV table management
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'light',
  colorScheme: 'blue',
  fontSize: 'normal',
  highContrast: false,
  layoutMode: 'default',
  showShortcuts: true,
  enableSounds: true,
  tableMode: false
};

// Create context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Storage key for localStorage
const STORAGE_KEY = 'controlai_user_preferences';

// Provider component
export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      
      // Apply theme to document
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
      
      // Apply high contrast if needed
      if (preferences.highContrast) {
        document.documentElement.classList.add('contrast-high');
      } else {
        document.documentElement.classList.remove('contrast-high');
      }
      
      // Apply font size
      document.documentElement.style.fontSize = 
        preferences.fontSize === 'small' ? '14px' : 
        preferences.fontSize === 'large' ? '18px' : '16px';
      
      // Apply color scheme
      // This would be implemented with CSS variables for a real app
      // Here we just log it to show the concept
      console.log(`Applying color scheme: ${preferences.colorScheme}`);
      
      // Set CSS variable for primary color based on colorScheme
      let hslValues;
      switch(preferences.colorScheme) {
        case 'green':
          hslValues = '142 76% 36%'; // Green
          break;
        case 'amber':
          hslValues = '25 95% 53%'; // Amber
          break;
        case 'purple':
          hslValues = '262 80% 50%'; // Purple
          break;
        case 'rose':
          hslValues = '336 80% 58%'; // Rose
          break;
        default:
          hslValues = '210 100% 50%'; // Default blue
      }
      
      // Set the CSS variables
      document.documentElement.style.setProperty('--primary', hslValues);
      document.documentElement.style.setProperty('--primary-light', hslValues.replace('50%', '60%'));
      document.documentElement.style.setProperty('--primary-dark', hslValues.replace('50%', '40%'));
    }
  }, [preferences, loaded]);

  // Update a single preference
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Reset to defaults
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Hook to use preferences
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  
  return context;
};

export default UserPreferencesContext;