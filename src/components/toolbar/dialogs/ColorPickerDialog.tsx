import { useEffect } from 'react'
import { DialogCloseButton } from '../../ui/dialog-close-button'
import './color-picker-dialog.css'

interface ColorPickerDialogProps {
  currentColor: string
  onColorChange: (_color: string) => void
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
  { name: 'Gray', value: '#6B7280' },
]

export function ColorPickerDialog({ currentColor, onColorChange, onClose, useRelativePosition = false }: ColorPickerDialogProps) {
  // Set default color based on theme if no color is set
  useEffect(() => {
    if (!currentColor || currentColor === '') {
      const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
      onColorChange(foregroundColor || '#000000')
    }
  }, [currentColor, onColorChange]) // Only run when dependencies change

  return (
    <div
      data-color-dialog
      className="color-picker-dialog"
      data-positioned={!useRelativePosition}>
      <div className="color-picker-dialog-header">
        <span className="color-picker-dialog-title">Pick Color</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      {/* Custom Color Input */}
      <div className="color-picker-dialog-section">
        <label className="color-picker-dialog-label">
          Custom Color
        </label>
        <div className="color-picker-dialog-custom">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="color-picker-dialog-color-input"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="color-picker-dialog-text-input"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div className="color-picker-dialog-section">
        <label className="color-picker-dialog-label">
          Presets
        </label>
        <div className="color-picker-dialog-preset-grid">
          {presetColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className="color-picker-dialog-preset-button"
              data-selected={currentColor === color.value}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}