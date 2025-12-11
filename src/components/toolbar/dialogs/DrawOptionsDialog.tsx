import { X } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

interface DrawOptionsDialogProps {
  lineStyle: 'solid' | 'dashed'
  lineEnd: 'none' | 'arrow' | 'tShape'
  brushSize: number
  pathMode: 'sharp' | 'curve'
  onLineStyleChange: (style: 'solid' | 'dashed') => void
  onLineEndChange: (end: 'none' | 'arrow' | 'tShape') => void
  onBrushSizeChange: (size: number) => void
  onPathModeChange: (mode: 'sharp' | 'curve') => void
  onClose: () => void
  useRelativePosition?: boolean
}

const brushSizes = [
  { size: 2, label: 'Thin' },
  { size: 3, label: 'Medium' },
  { size: 5, label: 'Thick' },
  { size: 7, label: 'Extra Thick' },
]

export function DrawOptionsDialog({
  lineStyle,
  lineEnd,
  brushSize,
  pathMode,
  onLineStyleChange,
  onLineEndChange,
  onBrushSizeChange,
  onPathModeChange,
  onClose,
  useRelativePosition = false,
}: DrawOptionsDialogProps) {
  const { theme } = useTheme()
  
  return (
    <div
      data-draw-dialog
      className={`${useRelativePosition ? '' : 'absolute left-24 top-32'} w-64 rounded-2xl shadow-2xl border p-4 z-50 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Draw</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
            theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Path Mode */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Path Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onPathModeChange('sharp')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
              pathMode === 'sharp'
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg viewBox="0 0 48 16" className="h-4 w-full">
              <polyline
                points="4,12 16,4 32,12 44,4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
            </svg>
          </button>
          <button
            onClick={() => onPathModeChange('curve')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
              pathMode === 'curve'
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg viewBox="0 0 48 16" className="h-4 w-full">
              <path
                d="M 4,12 C 10,4 22,4 24,8 C 26,12 38,12 44,4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Line Style */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Line Style
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onLineStyleChange('solid')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
              lineStyle === 'solid'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="h-0.5 bg-current mx-auto w-12" />
          </button>
          <button
            onClick={() => onLineStyleChange('dashed')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
              lineStyle === 'dashed'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="h-0.5 mx-auto w-12 flex gap-1">
              <div className="flex-1 bg-current" />
              <div className="flex-1 bg-current" />
              <div className="flex-1 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {/* Line End */}
      <div className="mb-4">
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Line End
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onLineEndChange('none')}
            className={`py-2 px-3 rounded-lg transition-all text-xs cursor-pointer ${
              lineEnd === 'none'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            None
          </button>
          <button
            onClick={() => onLineEndChange('arrow')}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              lineEnd === 'arrow'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg width="20" height="16" viewBox="0 0 20 16">
              <line x1="2" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 8l-4-4v8z" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onLineEndChange('tShape')}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              lineEnd === 'tShape'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 4v8M2 8h12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Line Thickness
        </label>
        <div className="grid grid-cols-2 gap-2">
          {brushSizes.map((brush) => (
            <button
              key={brush.size}
              onClick={() => onBrushSizeChange(brush.size)}
              className={`py-3 px-3 rounded-lg transition-all cursor-pointer ${
                brushSize === brush.size
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="bg-current rounded-full"
                  style={{ width: `${brush.size * 2}px`, height: `${brush.size * 2}px` }}
                />
                <span className="text-xs">{brush.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}