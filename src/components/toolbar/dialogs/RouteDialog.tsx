import { X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { eventBus } from '../../../services/EventBus';

interface RouteDialogProps {
  onClose: () => void;
}

const routes = [
  { number: 1, name: 'Flat', description: 'Quick horizontal route' },
  { number: 2, name: 'Slant', description: 'Diagonal inside cut' },
  { number: 3, name: 'Comeback', description: 'Out and back towards QB' },
  { number: 4, name: 'Curl', description: 'Stop and turn back' },
  { number: 5, name: 'Out', description: 'Break towards sideline' },
  { number: 6, name: 'Dig', description: 'Deep in-breaking route' },
  { number: 7, name: 'Corner', description: 'Deep break to corner' },
  { number: 8, name: 'Post', description: 'Deep inside break' },
  { number: 9, name: 'Go', description: 'Straight vertical route' },
];

export function RouteDialog({ onClose }: RouteDialogProps) {
  const { theme } = useTheme();
  
  const handleRouteSelect = (route: typeof routes[0]) => {
    eventBus.emit('route:add', { route });
    onClose();
  };

  return (
    <div 
      data-route-dialog
      className={`absolute left-24 top-6 w-80 rounded-2xl shadow-2xl border p-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`flex items-center justify-between mb-4 sticky top-0 pb-2 border-b ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Add Route</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
            theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {routes.map((route) => (
          <button
            key={route.number}
            onClick={() => handleRouteSelect(route)}
            className={`w-full p-3 rounded-xl border transition-all text-left group cursor-pointer ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-blue-500'
                : 'bg-gray-50 hover:bg-blue-50 border-gray-100 hover:border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                {route.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className={theme === 'dark' ? 'text-gray-100 mb-1' : 'text-gray-900 mb-1'}>
                  {route.name}
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {route.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}