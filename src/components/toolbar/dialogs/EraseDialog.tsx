import { X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface EraseDialogProps {
  eraseSize: number;
  onEraseSizeChange: (size: number) => void;
  onClose: () => void;
}

const eraseSizes = [
  { size: 20, label: 'Small' },
  { size: 40, label: 'Medium' },
  { size: 60, label: 'Large' },
];

export function EraseDialog({
  eraseSize,
  onEraseSizeChange,
  onClose,
}: EraseDialogProps) {
  const { theme } = useTheme();
  
  return (
    <div 
      data-erase-dialog
      className={`absolute left-24 top-32 w-64 rounded-2xl shadow-2xl border p-4 z-50 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Erase</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
            theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Erase Size */}
      <div>
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Eraser Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {eraseSizes.map((erase) => (
            <button
              key={erase.size}
              onClick={() => onEraseSizeChange(erase.size)}
              className={`py-4 px-3 rounded-lg transition-all cursor-pointer ${
                eraseSize === erase.size
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="bg-current rounded-full"
                  style={{ width: `${erase.size}px`, height: `${erase.size}px` }}
                />
                <span className="text-xs">{erase.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
