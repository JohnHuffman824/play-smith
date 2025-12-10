import { useTheme } from '../../../contexts/ThemeContext'

interface HashDialogProps {
  currentAlignment: 'center' | 'left' | 'right'
  onAlignmentChange: (alignment: 'center' | 'left' | 'right') => void
  onClose: () => void
}

export function HashDialog({ currentAlignment, onAlignmentChange, onClose }: HashDialogProps) {
  const { theme } = useTheme()
  const alignments: Array<{ value: 'center' | 'left' | 'right'; label: string }> = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Middle' },
    { value: 'right', label: 'Right' },
  ]

  return (
    <>
      {/* Dialog */}
      <div
        data-hash-dialog
        className={`fixed left-24 top-1/2 -translate-y-1/2 rounded-2xl shadow-2xl p-4 z-50 w-48 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h3 className={`px-2 mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Ball on Hash
          </h3>
          
          {alignments.map((alignment) => (
            <button
              key={alignment.value}
              onClick={() => {
                onAlignmentChange(alignment.value)
                onClose()
              }}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                currentAlignment === alignment.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {alignment.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}