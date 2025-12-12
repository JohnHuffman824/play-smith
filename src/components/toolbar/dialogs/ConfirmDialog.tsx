import { useTheme } from '../../../contexts/ThemeContext'

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
  const { theme } = useTheme()
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={theme === 'dark' ? 'text-gray-100 mb-2' : 'text-gray-900 mb-2'}>{title}</h3>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cancelLabel}
          </button>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                actionVariant === 'primary'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}