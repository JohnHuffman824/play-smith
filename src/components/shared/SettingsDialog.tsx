import { X, Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

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
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-auto w-auto p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <label className="block mb-3">Appearance</label>
            <div className="flex gap-3">
              <Button
                onClick={() => onThemeChange('light')}
                variant="outline"
                className={`flex-1 h-auto py-3 ${
                    theme == 'light'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
              >
                <Sun className="w-5 h-5" />
                <span>Light</span>
              </Button>
              <Button
                onClick={() => onThemeChange('dark')}
                variant="outline"
                className={`flex-1 h-auto py-3 ${
                    theme == 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
              >
                <Moon className="w-5 h-5" />
                <span>Dark</span>
              </Button>
            </div>
          </div>

          <div>
            <label className="block mb-3">Position Naming System</label>
            <div className="space-y-2">
              {POSITION_NAMING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onPositionNamingChange(option.value)}
                  variant="outline"
                  className={`w-full h-auto py-3 justify-start ${
                      positionNaming == option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-3">Competition Level</label>
            <div className="space-y-2">
              {FIELD_LEVEL_OPTIONS.map((level) => (
                <Button
                  key={level}
                  onClick={() => onFieldLevelChange(level)}
                  variant="outline"
                  className={`w-full h-auto py-3 justify-start ${
                      fieldLevel == level
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-6 py-4 border-t border-border
            flex justify-end"
        >
          <Button
            onClick={onClose}
            variant="default"
            className="px-6"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
