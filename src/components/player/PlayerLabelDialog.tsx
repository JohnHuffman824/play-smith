import { Trash2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import unlinkIconPath from '../../imports/unlink-icon.svg'
import './player-label-dialog.css'

interface PlayerLabelDialogProps {
  position: { x: number; y: number }
  currentLabel: string
  hasLinkedDrawing: boolean
  onLabelChange: (_label: string) => void
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
      <div className="player-label-dialog-backdrop" onClick={onClose} />

      <div
        data-player-label-dialog
        className="player-label-dialog"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 200}px`,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="player-label-dialog-arrow" />
        <div className="player-label-dialog-arrow-border" />

        <div className="player-label-dialog-row">
          {labelsRow1.map((label, index) => (
            <button
              key={index}
              onClick={() => handleLabelSelect(label)}
              className={`player-label-dialog-label-button ${
                currentLabel === label
                  ? 'player-label-dialog-label-button-active'
                  : 'player-label-dialog-label-button-inactive'
              }`}
            >
              {label === '' ? (
                <span className="player-label-dialog-placeholder">—</span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

        <div className="player-label-dialog-row">
          {labelsRow2.map((label, index) => (
            <button
              key={index}
              onClick={() => handleLabelSelect(label)}
              className={`player-label-dialog-label-button ${
                currentLabel === label
                  ? 'player-label-dialog-label-button-active'
                  : 'player-label-dialog-label-button-inactive'
              }`}
            >
              {label === '' ? (
                <span className="player-label-dialog-placeholder">—</span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

        <div className="player-label-dialog-custom">
          <input
            ref={inputRef}
            type="text"
            placeholder="Custom"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="player-label-dialog-input"
            style={{ width: hasLinkedDrawing ? '96px' : '136px' }}
            maxLength={3}
          />
          {hasLinkedDrawing && (
            <button
              onClick={() => {
                onUnlink()
                onClose()
              }}
              className="player-label-dialog-action-button player-label-dialog-unlink-button"
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
            className="player-label-dialog-action-button player-label-dialog-delete-button"
          >
            <Trash2 className="player-label-dialog-icon" />
          </button>
        </div>
      </div>
    </>
  )
}