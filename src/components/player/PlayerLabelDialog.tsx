import { useTheme } from '../../contexts/ThemeContext'
import { Trash2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import unlinkIconPath from '../../imports/unlink-icon.svg'

interface PlayerLabelDialogProps {
  position: { x: number; y: number }
  currentLabel: string
  hasLinkedDrawing: boolean
  onLabelChange: (label: string) => void
  onUnlink: () => void
  onDelete: () => void
  onClose: () => void
}

const labelsRow1 = ['X', 'Y', 'Z', 'F']
const labelsRow2 = ['T', 'Q', 'H', '']

// All predefined labels (excluding empty string)
const ALL_PREDEFINED_LABELS = [...labelsRow1, ...labelsRow2].filter(label => label != '')

export function PlayerLabelDialog({
  position,
  currentLabel,
  hasLinkedDrawing,
  onLabelChange,
  onUnlink,
  onDelete,
  onClose,
}: PlayerLabelDialogProps) {
  const { theme } = useTheme()
  const [customLabel, setCustomLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLabelSelect = useCallback((label: string) => {
    onLabelChange(label)
    onClose()
  }, [onLabelChange, onClose])

  function handleCustomLabelSubmit() {
    if (customLabel.trim()) {
      onLabelChange(customLabel.trim())
      onClose()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key == 'Enter') {
      handleCustomLabelSubmit()
    }
  }

  // Handle keyboard shortcuts for predefined labels
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Check if the custom input is focused
      const isInputFocused = document.activeElement == inputRef.current
      
      // Only handle shortcuts if input is NOT focused
      if (isInputFocused) return

      // Handle delete/backspace to delete player
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onDelete()
        onClose()
        return
      }

      // Convert pressed key to uppercase to match label format
      const pressedKey = e.key.toUpperCase()
      
      // Check if the pressed key matches any predefined label
      if (ALL_PREDEFINED_LABELS.includes(pressedKey)) {
        e.preventDefault()
        handleLabelSelect(pressedKey)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleLabelSelect, onDelete, onClose])

  return (
    <>
      {/* Backdrop to close dialog when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div
        data-player-label-dialog
        className="fixed z-50 rounded-2xl shadow-2xl border border-border bg-card p-3"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 200}px`, // Position higher above the player
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow pointing down */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
            theme === 'dark' ? 'border-gray-800' : 'border-white'
          }`}
          style={{
            bottom: '-8px',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'}`,
          }}
        />
        {/* Border arrow for the carat */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
          style={{
            bottom: '-9px',
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: `9px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            zIndex: -1,
          }}
        />

        {/* Row 1 */}
        <div className="flex gap-2">
          {labelsRow1.map((label, index) => (
            <button
              key={index}
              onClick={() => handleLabelSelect(label)}
              className={`w-10 h-10 rounded-lg transition-all cursor-pointer ${
                currentLabel === label
                  ? 'bg-blue-500 text-white shadow-md scale-110'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {label === '' ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-2 mt-2">
          {labelsRow2.map((label, index) => (
            <button
              key={index}
              onClick={() => handleLabelSelect(label)}
              className={`w-10 h-10 rounded-lg transition-all cursor-pointer ${
                currentLabel === label
                  ? 'bg-blue-500 text-white shadow-md scale-110'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {label === '' ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

        {/* Custom Label Input and Delete Button */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <input
            ref={inputRef}
            type="text"
            placeholder="Custom"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 px-3 rounded-lg transition-all outline-none bg-input-background text-foreground placeholder:text-muted-foreground border border-input focus:ring-2 focus:ring-ring/20"
            style={{ width: hasLinkedDrawing ? '96px' : '136px' }}
            maxLength={3}
          />
          {hasLinkedDrawing && (
            <button
              onClick={() => {
                onUnlink()
                onClose()
              }}
              className="w-10 h-10 rounded-lg transition-all cursor-pointer flex items-center justify-center flex-shrink-0 bg-secondary text-secondary-foreground hover:bg-accent"
              title="Unlink drawing"
            >
              <svg width="18" height="18" viewBox="0 0 512 509.84" fill="currentColor">
                <path d={unlinkIconPath} />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              onDelete()
              onClose()
            }}
            className={`w-10 h-10 rounded-lg transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
              theme === 'dark'
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  )
}