import { X } from 'lucide-react'
import { useTheme } from '@/contexts/SettingsContext'

interface ColorPickerDialogProps {
  currentColor: string
  onColorChange: (color: string) => void
  onClose: () => void
  position?: {
    left?: string
    top?: string
  }
  useRelativePosition?: boolean
}

const presetColors = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
]

export function ColorPickerDialog({ currentColor, onColorChange, onClose, position, useRelativePosition = false }: ColorPickerDialogProps) {
  const positionClasses = useRelativePosition
    ? ''
    : position
      ? `${position.left || 'left-24'} ${position.top || 'top-72'}`
      : 'left-24 top-72'

  return (
    <div
      data-color-dialog
      className={`${useRelativePosition ? '' : `absolute ${positionClasses}`} w-64 rounded-2xl shadow-2xl border border-border bg-card p-4 z-50`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-foreground">Pick Color</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent text-muted-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Custom Color Input */}
      <div className="mb-4">
        <label className="block text-xs mb-2 text-muted-foreground">
          Custom Color
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-12 h-12 rounded-lg border border-border cursor-pointer"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm bg-input-background text-foreground border-input placeholder:text-muted-foreground"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <label className="block text-xs mb-2 text-muted-foreground">
          Presets
        </label>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-10 h-10 rounded-lg transition-all hover:scale-110 cursor-pointer ${
                currentColor === color.value
                  ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                  : 'border border-border'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}