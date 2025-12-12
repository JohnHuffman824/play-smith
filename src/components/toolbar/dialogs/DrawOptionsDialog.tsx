import { X } from 'lucide-react'

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
  
  return (
    <div
      data-draw-dialog
      className={`${useRelativePosition ? '' : 'absolute left-24 top-32'} w-64 rounded-2xl shadow-2xl bg-card border border-border p-4 z-50`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-foreground">Draw</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X size={16} />
        </button>
      </div>

      {/* Path Mode */}
      <div className="mb-4">
        <label className="block text-xs mb-2 text-muted-foreground">
          Path Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onPathModeChange('sharp')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              pathMode === 'sharp'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
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
            className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              pathMode === 'curve'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
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
        <label className="block text-xs mb-2 text-muted-foreground">
          Line Style
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onLineStyleChange('solid')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              lineStyle === 'solid'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
            }`}
          >
            <div className="h-0.5 bg-current mx-auto w-12" />
          </button>
          <button
            onClick={() => onLineStyleChange('dashed')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              lineStyle === 'dashed'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
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
        <label className="block text-xs mb-2 text-muted-foreground">
          Line End
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onLineEndChange('none')}
            className={`py-2 px-3 rounded-lg transition-all duration-200 text-xs cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              lineEnd === 'none'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
            }`}
          >
            None
          </button>
          <button
            onClick={() => onLineEndChange('arrow')}
            className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              lineEnd === 'arrow'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
            }`}
          >
            <svg width="20" height="16" viewBox="0 0 20 16">
              <line x1="2" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 8l-4-4v8z" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onLineEndChange('tShape')}
            className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              lineEnd === 'tShape'
                ? 'bg-action-button text-action-button-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
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
        <label className="block text-xs mb-2 text-muted-foreground">
          Line Thickness
        </label>
        <div className="grid grid-cols-2 gap-2">
          {brushSizes.map((brush) => (
            <button
              key={brush.size}
              onClick={() => onBrushSizeChange(brush.size)}
              className={`py-3 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                brushSize === brush.size
                  ? 'bg-action-button text-action-button-foreground'
                  : 'bg-muted text-foreground hover:bg-accent'
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