import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { SystemFormation } from '../../db/seeds/system_formations'

interface TeamFormation {
  id: number
  name: string
  description?: string
}

interface FormationOnboardingDialogProps {
  isOpen: boolean
  systemFormations: SystemFormation[]
  teamFormations: TeamFormation[]
  onComplete: (formations: SystemFormation[]) => void
  onSkip: () => void
}

export function FormationOnboardingDialog({
  isOpen,
  systemFormations,
  teamFormations,
  onComplete,
  onSkip
}: FormationOnboardingDialogProps) {
  const [selectedSystem, setSelectedSystem] = useState<Set<string>>(new Set())
  const [selectedTeam, setSelectedTeam] = useState<Set<number>>(new Set())

  if (!isOpen) return null

  function toggleSystem(name: string) {
    const newSet = new Set(selectedSystem)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setSelectedSystem(newSet)
  }

  function toggleTeam(id: number) {
    const newSet = new Set(selectedTeam)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedTeam(newSet)
  }

  function handleComplete() {
    const selected = systemFormations.filter(f => selectedSystem.has(f.name))
    onComplete(selected)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Set Up Formations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select formations to import into your playbook, or create your own.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* System Defaults */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">System Defaults</h3>
            <div className="grid grid-cols-2 gap-2">
              {systemFormations.map(f => (
                <button
                  key={f.name}
                  onClick={() => toggleSystem(f.name)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer
                    ${selectedSystem.has(f.name)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border flex items-center justify-center
                    ${selectedSystem.has(f.name)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedSystem.has(f.name) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Team Library */}
          {teamFormations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Team Library</h3>
              <div className="grid grid-cols-2 gap-2">
                {teamFormations.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleTeam(f.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer
                      ${selectedTeam.has(f.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center
                      ${selectedTeam.has(f.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                      }
                    `}>
                      {selectedTeam.has(f.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium">{f.name}</div>
                      {f.description && (
                        <div className="text-xs text-gray-500">{f.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create from scratch */}
          <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Create from scratch</span>
          </button>
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Skip for now
          </button>
          <button
            onClick={handleComplete}
            disabled={selectedSystem.size === 0 && selectedTeam.size === 0}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Import Selected ({selectedSystem.size + selectedTeam.size})
          </button>
        </div>
      </div>
    </div>
  )
}
