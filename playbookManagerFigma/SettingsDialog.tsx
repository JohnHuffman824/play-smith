import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomSelect } from './CustomSelect';
import { PositionNaming, FieldLevel } from '../contexts/ConfigContext';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  positionNaming: PositionNaming;
  onPositionNamingChange: (value: PositionNaming) => void;
  fieldLevel: FieldLevel;
  onFieldLevelChange: (value: FieldLevel) => void;
}

type ThemeMode = 'Light Mode' | 'Dark Mode';

export function SettingsDialog({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  positionNaming,
  onPositionNamingChange,
  fieldLevel,
  onFieldLevelChange,
}: SettingsDialogProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    theme === 'dark' ? 'Dark Mode' : 'Light Mode'
  );

  // Sync local theme state with parent theme
  useEffect(() => {
    setThemeMode(theme === 'dark' ? 'Dark Mode' : 'Light Mode');
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    onThemeChange(newTheme === 'Dark Mode' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        data-settings-dialog
        className="relative bg-card rounded-2xl shadow-2xl p-6 z-50 w-80"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-foreground">Settings</span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Position Naming System */}
          <div>
            <label className="text-sm mb-2 block text-muted-foreground">
              Position Naming System
            </label>
            <CustomSelect
              value={positionNaming}
              onChange={(value) => onPositionNamingChange(value as PositionNaming)}
              options={[
                { value: 'XYZABQ', label: 'X, Y, Z, A, B, Q' },
                { value: 'XYZFTQ', label: 'X, Y, Z, F, T, Q' },
                { value: 'Custom', label: 'Custom' },
              ]}
            />
          </div>

          {/* Competition Level */}
          <div>
            <label className="text-sm mb-2 block text-muted-foreground">
              Competition Level
            </label>
            <CustomSelect
              value={fieldLevel}
              onChange={(value) => onFieldLevelChange(value as FieldLevel)}
              options={[
                { value: 'High School', label: 'High School' },
                { value: 'College', label: 'College' },
                { value: 'Pro', label: 'Pro' },
              ]}
            />
          </div>

          {/* Appearance */}
          <div>
            <label className="text-sm mb-2 block text-muted-foreground">
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
    </div>
  );
}