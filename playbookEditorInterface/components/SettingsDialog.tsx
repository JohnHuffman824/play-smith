import { X, Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  positionNaming: string
  onPositionNamingChange: (naming: string) => void
  fieldLevel: string
  onFieldLevelChange: (level: string) => void
}

const POSITION_NAMING_OPTIONS = [
  { value: 'XYZABQ', label: 'X, Y, Z, A, B, Q' },
  { value: 'XYZFTQ', label: 'X, Y, Z, F, T, Q' },
  { value: 'Custom', label: 'Custom' },
]

const FIELD_LEVEL_OPTIONS = ['High School', 'College', 'Pro']

export function SettingsDialog({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  positionNaming,
  onPositionNamingChange,
  fieldLevel,
  onFieldLevelChange,
}: SettingsDialogProps) {
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
          shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto"
      >
        <div 
          className="flex items-center justify-between px-6 py-4 
            border-b border-border"
        >
          <h2>Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg 
              transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <label className="block mb-3">Appearance</label>
            <div className="flex gap-3">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 flex items-center justify-center 
                  gap-2 px-4 py-3 rounded-lg border-2 
                  transition-all duration-200 ${
                    theme == 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
              >
                <Sun className="w-5 h-5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 flex items-center justify-center 
                  gap-2 px-4 py-3 rounded-lg border-2 
                  transition-all duration-200 ${
                    theme == 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
              >
                <Moon className="w-5 h-5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-3">Position Naming System</label>
            <div className="space-y-2">
              {POSITION_NAMING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPositionNamingChange(option.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 
                    text-left transition-all duration-200 ${
                      positionNaming == option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-3">Competition Level</label>
            <div className="space-y-2">
              {FIELD_LEVEL_OPTIONS.map((level) => (
                <button
                  key={level}
                  onClick={() => onFieldLevelChange(level)}
                  className={`w-full px-4 py-3 rounded-lg border-2 
                    text-left transition-all duration-200 ${
                      fieldLevel == level
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-3">Move Skills on Hash Change</label>
            <div className="flex gap-3">
              <button
                onClick={() => {}}
                className="flex-1 px-4 py-3 rounded-lg border-2 
                  border-border hover:border-primary/50 
                  transition-all duration-200"
              >
                Yes
              </button>
              <button
                onClick={() => {}}
                className="flex-1 px-4 py-3 rounded-lg border-2 
                  border-primary bg-primary/5 transition-all duration-200"
              >
                No
              </button>
            </div>
          </div>
        </div>

        <div 
          className="px-6 py-4 border-t border-border 
            flex justify-end"
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-primary-foreground 
              rounded-lg hover:opacity-90 transition-all duration-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
