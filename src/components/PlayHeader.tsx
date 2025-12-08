import { useTheme } from '../contexts/ThemeContext';

interface PlayHeaderProps {
  formation: string;
  play: string;
  defensiveFormation: string;
  onFormationChange: (value: string) => void;
  onPlayChange: (value: string) => void;
  onDefensiveFormationChange: (value: string) => void;
}

export function PlayHeader({
  formation,
  play,
  defensiveFormation,
  onFormationChange,
  onPlayChange,
  onDefensiveFormationChange,
}: PlayHeaderProps) {
  const { theme } = useTheme();
  
  return (
    <div className="px-8 pt-6 pb-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={formation}
          onChange={(e) => onFormationChange(e.target.value)}
          placeholder="Formation"
          className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
          }`}
        />
        <input
          type="text"
          value={play}
          onChange={(e) => onPlayChange(e.target.value)}
          placeholder="Play"
          className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
          }`}
        />
        <input
          type="text"
          value={defensiveFormation}
          onChange={(e) => onDefensiveFormationChange(e.target.value)}
          placeholder="Defensive Formation"
          className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
          }`}
        />
        
        <button
          className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all shadow-sm hover:shadow-md whitespace-nowrap cursor-pointer"
        >
          Back to Playbook
        </button>
      </div>
    </div>
  );
}