import { AlertTriangle } from 'lucide-react'
import './conflict-dialog.css'

interface ConflictDialogProps {
  isOpen: boolean
  playerRole: string
  existingConcept: string
  newConcept: string
  onReplace: () => void
  onCancel: () => void
}

export function ConflictDialog({
  isOpen,
  playerRole,
  existingConcept,
  newConcept,
  onReplace,
  onCancel
}: ConflictDialogProps) {
  if (!isOpen) return null

  return (
    <div className="conflict-dialog-backdrop">
      <div className="conflict-dialog">
        <div className="conflict-dialog-header">
          <AlertTriangle className="conflict-dialog-icon" />
          <h3 className="conflict-dialog-title">Route Conflict</h3>
        </div>

        <p className="conflict-dialog-message">
          {playerRole} already has <strong>{existingConcept}</strong> assigned.
          Replace with <strong>{newConcept}</strong>?
        </p>

        <div className="conflict-dialog-actions">
          <button
            onClick={onCancel}
            className="conflict-dialog-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onReplace}
            className="conflict-dialog-confirm"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  )
}
