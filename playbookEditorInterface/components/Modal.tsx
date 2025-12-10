import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key == 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div 
        className="relative bg-popover border border-border rounded-xl 
          shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto"
      >
        <div 
          className="flex items-center justify-between px-6 py-4 
            border-b border-border"
        >
          <h2>{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg 
              transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
