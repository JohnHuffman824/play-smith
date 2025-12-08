import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ColorPickerDialogProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

const presetColors = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
];

export function ColorPickerDialog({ currentColor, onColorChange, onClose }: ColorPickerDialogProps) {
  const { theme } = useTheme();
  
  return (
    <div 
      data-color-dialog
      className={`absolute left-24 top-72 w-64 rounded-2xl shadow-2xl border p-4 z-50 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Pick Color</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
            theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Custom Color Input */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Custom Color
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className={`w-12 h-12 rounded-lg border cursor-pointer ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Presets
        </label>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-10 h-10 rounded-lg transition-all hover:scale-110 cursor-pointer ${
                currentColor === color.value
                  ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                  : theme === 'dark' ? 'border border-gray-600' : 'border border-gray-200'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}