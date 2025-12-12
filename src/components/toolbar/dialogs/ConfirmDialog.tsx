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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <h3 className="text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent
                       transition-all duration-200 cursor-pointer outline-none
                       focus-visible:ring-[3px] focus-visible:ring-ring/50 whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
                         outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
                         whitespace-nowrap ${
                actionVariant === 'primary'
                  ? 'bg-action-button text-action-button-foreground hover:bg-action-button/90'
                  : 'border border-border hover:bg-accent'
              }`}
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
                       outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
                       whitespace-nowrap ${
              variant === 'danger'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-action-button text-action-button-foreground hover:bg-action-button/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}