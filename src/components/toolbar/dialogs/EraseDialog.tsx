import { DialogCloseButton } from '../../ui/dialog-close-button'
import './erase-dialog.css'

interface EraseDialogProps {
  eraseSize: number
  onEraseSizeChange: (_size: number) => void
  onClose: () => void
}

const eraseSizes = [
  { size: 20, label: 'Small' },
  { size: 40, label: 'Medium' },
  { size: 60, label: 'Large' },
]

export function EraseDialog({
  eraseSize,
  onEraseSizeChange,
  onClose,
}: EraseDialogProps) {
  return (
    <div
      data-erase-dialog
      className="erase-dialog">
      <div className="erase-dialog-header">
        <span className="erase-dialog-title">Erase</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      {/* Erase Size */}
      <div className="erase-dialog-section">
        <label className="erase-dialog-label">
          Eraser Size
        </label>
        <div className="erase-dialog-size-grid">
          {eraseSizes.map((erase) => (
            <button
              key={erase.size}
              onClick={() => onEraseSizeChange(erase.size)}
              className="erase-dialog-size-button"
              data-active={eraseSize === erase.size}
            >
              <div className="erase-dialog-size-content">
                <div
                  className="erase-dialog-size-dot"
                  style={{ width: `${erase.size}px`, height: `${erase.size}px` }}
                />
                <span className="erase-dialog-size-label">{erase.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
