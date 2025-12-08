import { X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { CustomSelect } from '../CustomSelect';

interface SettingsDialogProps {
  onClose: () => void;
}

type PositionNaming = 'XYZABQ' | 'XYZFTQ' | 'Custom';
type FieldLevel = 'High School' | 'College' | 'Pro';
type ThemeMode = 'Light Mode' | 'Dark Mode';

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [positionNaming, setPositionNaming] = useState<PositionNaming>('XYZABQ');
  const [fieldLevel, setFieldLevel] = useState<FieldLevel>('College');
  const [themeMode, setThemeMode] = useState<ThemeMode>('Light Mode');
  
  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    setTheme(newTheme === 'Dark Mode' ? 'dark' : 'light');
  };

  return (
    <div 
      data-settings-dialog
      className={`fixed left-24 top-1/2 -translate-y-1/2 rounded-2xl shadow-2xl p-6 z-50 w-80 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Settings</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
            theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Position Naming System */}
        <div>
          <label className={`text-sm mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Position Naming System
          </label>
          <CustomSelect
            value={positionNaming}
            onChange={(value) => setPositionNaming(value as PositionNaming)}
            options={[
              { value: 'XYZABQ', label: 'X, Y, Z, A, B, Q' },
              { value: 'XYZFTQ', label: 'X, Y, Z, F, T, Q' },
              { value: 'Custom', label: 'Custom' },
            ]}
          />
        </div>

        {/* Competition Level */}
        <div>
          <label className={`text-sm mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Competition Level
          </label>
          <CustomSelect
            value={fieldLevel}
            onChange={(value) => setFieldLevel(value as FieldLevel)}
            options={[
              { value: 'High School', label: 'High School' },
              { value: 'College', label: 'College' },
              { value: 'Pro', label: 'Pro' },
            ]}
          />
        </div>

        {/* Appearance */}
        <div>
          <label className={`text-sm mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Appearance
          </label>
          <CustomSelect
            value={themeMode}
            onChange={(value) => handleThemeChange(value as ThemeMode)}
            options={[
              { value: 'Light Mode', label: 'Light Mode' },
              { value: 'Dark Mode', label: 'Dark Mode' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}