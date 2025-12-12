import { DialogCloseButton } from '../../ui/dialog-close-button'

interface EraseDialogProps {
  eraseSize: number
  onEraseSizeChange: (size: number) => void
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
      className="absolute left-24 top-32 w-64 rounded-2xl shadow-2xl bg-popover border border-border p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-foreground">Erase</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      {/* Erase Size */}
      <div>
        <label className="block text-xs mb-2 text-muted-foreground">
          Eraser Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {eraseSizes.map((erase) => (
            <button
              key={erase.size}
              onClick={() => onEraseSizeChange(erase.size)}
              className={`py-4 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                eraseSize === erase.size
                  ? 'bg-action-button text-action-button-foreground'
                  : 'bg-muted text-foreground hover:bg-accent'
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
  )
}
