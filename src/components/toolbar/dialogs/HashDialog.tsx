import { useTheme } from '@/contexts/SettingsContext'
import type { HashAlignment } from '../../../types/field.types'

interface HashDialogProps {
  currentAlignment: HashAlignment
  linemenAtDefault: boolean
  onAlignmentChange: (alignment: HashAlignment) => void
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
        className={`${useRelativePosition ? '' : 'fixed left-24 top-1/2 -translate-y-1/2'} rounded-2xl shadow-2xl border border-border bg-popover p-4 z-50 w-48`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h3 className="px-2 mb-3 text-muted-foreground">
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
                className={`w-full px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
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