import './confirm-dialog.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
  actionLabel?: string
  onAction?: () => void
  actionVariant?: 'primary' | 'default'
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
  actionLabel,
  onAction,
  actionVariant = 'primary',
}: ConfirmDialogProps) {
  return (
    <div className="confirm-dialog-backdrop">
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-actions">
          <button
            onClick={onCancel}
            className="confirm-dialog-button"
          >
            {cancelLabel}
          </button>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="confirm-dialog-button"
              data-variant={actionVariant}
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="confirm-dialog-button"
            data-variant={variant === 'danger' ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}