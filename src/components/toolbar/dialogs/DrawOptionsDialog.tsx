import { DialogCloseButton } from '../../ui/dialog-close-button'
import { BRUSH_SIZES } from './dialog.constants'
import {
	BrushSizeSelector,
	LineEndSelector,
	LineStyleSelector,
	PathModeSelector,
} from './shared'
import './draw-options-dialog.css'
import './drawing-properties-dialog.css'

interface DrawOptionsDialogProps {
  lineStyle: 'solid' | 'dashed'
  lineEnd: 'none' | 'arrow' | 'tShape'
  brushSize: number
  pathMode: 'sharp' | 'curve'
  onLineStyleChange: (_style: 'solid' | 'dashed') => void
  onLineEndChange: (_end: 'none' | 'arrow' | 'tShape') => void
  onBrushSizeChange: (_size: number) => void
  onPathModeChange: (_mode: 'sharp' | 'curve') => void
  onClose: () => void
  useRelativePosition?: boolean
}

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
        <PathModeSelector pathMode={pathMode} onChange={onPathModeChange} />
      </div>

      {/* Line Style */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line Style
        </label>
        <LineStyleSelector lineStyle={lineStyle} onChange={onLineStyleChange} />
      </div>

      {/* Line End */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line End
        </label>
        <LineEndSelector lineEnd={lineEnd} onChange={onLineEndChange} />
      </div>

      {/* Brush Size */}
      <div className="drawing-properties-dialog-section">
        <label className="drawing-properties-dialog-label">
          Line Thickness
        </label>
        <BrushSizeSelector brushSize={brushSize} sizes={BRUSH_SIZES} onChange={onBrushSizeChange} />
      </div>
    </div>
  )
}