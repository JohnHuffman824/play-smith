import { AlertTriangle } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold">Route Conflict</h3>
        </div>

        <p className="mb-4 text-gray-600 dark:text-gray-300">
          {playerRole} already has <strong>{existingConcept}</strong> assigned.
          Replace with <strong>{newConcept}</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onReplace}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors cursor-pointer"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  )
}
