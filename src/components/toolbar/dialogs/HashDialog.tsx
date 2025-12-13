import type { HashAlignment } from '../../../types/field.types'
import './hash-dialog.css'

interface HashDialogProps {
  currentAlignment: HashAlignment
  linemenAtDefault: boolean
  onAlignmentChange: (_alignment: HashAlignment) => void
  onClose: () => void
  useRelativePosition?: boolean
}

export function HashDialog({ currentAlignment, linemenAtDefault, onAlignmentChange, onClose, useRelativePosition = false }: HashDialogProps) {
  const alignments: Array<{ value: HashAlignment; label: string }> = [
    { value: 'left', label: 'Left' },
    { value: 'middle', label: 'Middle' },
    { value: 'right', label: 'Right' },
  ]

  return (
    <>
      {/* Dialog */}
      <div
        data-hash-dialog
        className="hash-dialog"
        data-positioned={!useRelativePosition}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hash-dialog-content">
          <h3 className="hash-dialog-title">
            Ball on Hash
          </h3>

          {alignments.map((alignment) => {
            const isSelected = linemenAtDefault && currentAlignment === alignment.value
            return (
              <button
                key={alignment.value}
                onClick={() => {
                  onAlignmentChange(alignment.value)
                  onClose()
                }}
                className="hash-dialog-button"
                data-selected={isSelected}
              >
                {alignment.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}