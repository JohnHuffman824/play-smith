import { DialogCloseButton } from '../../ui/dialog-close-button'
import './draw-options-dialog.css'
import './drawing-properties-dialog.css'

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
      className="draw-options-dialog"
      data-positioned={!useRelativePosition}>
      <div className="drawing-properties-dialog-header">
        <span className="drawing-properties-dialog-title">Draw</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      {/* Path Mode */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Path Mode
        </label>
        <div className="drawing-properties-button-group">
          <button
            onClick={() => onPathModeChange('sharp')}
            className="drawing-properties-option-button"
            data-active={pathMode === 'sharp'}
          >
            <svg viewBox="0 0 48 16" className="drawing-properties-path-svg">
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
            className="drawing-properties-option-button"
            data-active={pathMode === 'curve'}
          >
            <svg viewBox="0 0 48 16" className="drawing-properties-path-svg">
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
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line Style
        </label>
        <div className="drawing-properties-button-group">
          <button
            onClick={() => onLineStyleChange('solid')}
            className="drawing-properties-option-button"
            data-active={lineStyle === 'solid'}
          >
            <div className="drawing-properties-line-solid" />
          </button>
          <button
            onClick={() => onLineStyleChange('dashed')}
            className="drawing-properties-option-button"
            data-active={lineStyle === 'dashed'}
          >
            <div className="drawing-properties-line-dashed">
              <div className="drawing-properties-line-dashed-segment" />
              <div className="drawing-properties-line-dashed-segment" />
              <div className="drawing-properties-line-dashed-segment" />
            </div>
          </button>
        </div>
      </div>

      {/* Line End */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line End
        </label>
        <div className="drawing-properties-button-group-grid">
          <button
            onClick={() => onLineEndChange('none')}
            className="drawing-properties-line-end-text"
            data-active={lineEnd === 'none'}
          >
            None
          </button>
          <button
            onClick={() => onLineEndChange('arrow')}
            className="drawing-properties-line-end-icon"
            data-active={lineEnd === 'arrow'}
          >
            <svg width="20" height="16" viewBox="0 0 20 16">
              <line x1="2" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 8l-4-4v8z" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onLineEndChange('tShape')}
            className="drawing-properties-line-end-icon"
            data-active={lineEnd === 'tShape'}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 4v8M2 8h12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line Thickness
        </label>
        <div className="drawing-properties-button-group-2col">
          {brushSizes.map((brush) => (
            <button
              key={brush.size}
              onClick={() => onBrushSizeChange(brush.size)}
              className="drawing-properties-brush-button"
              data-active={brushSize === brush.size}
            >
              <div className="drawing-properties-brush-content">
                <div
                  className="drawing-properties-brush-dot"
                  style={{ width: `${brush.size * 2}px`, height: `${brush.size * 2}px` }}
                />
                <span className="drawing-properties-brush-label">{brush.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}