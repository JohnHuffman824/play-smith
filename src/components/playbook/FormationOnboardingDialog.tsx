import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { SystemFormation } from '../../db/seeds/system_formations'
import './formation-onboarding-dialog.css'

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
    <div className="formation-onboarding">
      <div className="formation-onboarding__dialog">
        <div className="formation-onboarding__header">
          <h2 className="formation-onboarding__title">Set Up Formations</h2>
          <p className="formation-onboarding__subtitle">
            Select formations to import into your playbook, or create your own.
          </p>
        </div>

        <div className="formation-onboarding__content">
          {/* System Defaults */}
          <div className="formation-onboarding__section">
            <h3 className="formation-onboarding__section-title">System Defaults</h3>
            <div className="formation-onboarding__grid">
              {systemFormations.map(f => (
                <button
                  key={f.name}
                  onClick={() => toggleSystem(f.name)}
                  className={`formation-onboarding__option ${selectedSystem.has(f.name) ? 'formation-onboarding__option--selected' : ''}`}
                >
                  <div className={`formation-onboarding__checkbox ${selectedSystem.has(f.name) ? 'formation-onboarding__checkbox--checked' : ''}`}>
                    {selectedSystem.has(f.name) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="formation-onboarding__option-text">
                    <div className="formation-onboarding__option-name">{f.name}</div>
                    <div className="formation-onboarding__option-description">{f.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Team Library */}
          {teamFormations.length > 0 && (
            <div className="formation-onboarding__section">
              <h3 className="formation-onboarding__section-title">Team Library</h3>
              <div className="formation-onboarding__grid">
                {teamFormations.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleTeam(f.id)}
                    className={`formation-onboarding__option ${selectedTeam.has(f.id) ? 'formation-onboarding__option--selected' : ''}`}
                  >
                    <div className={`formation-onboarding__checkbox ${selectedTeam.has(f.id) ? 'formation-onboarding__checkbox--checked' : ''}`}>
                      {selectedTeam.has(f.id) && <Check className="w-3 h-3" />}
                    </div>
                    <div className="formation-onboarding__option-text">
                      <div className="formation-onboarding__option-name">{f.name}</div>
                      {f.description && (
                        <div className="formation-onboarding__option-description">{f.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create from scratch */}
          <button className="formation-onboarding__create" aria-label="Create from scratch">
            <Plus className="w-4 h-4" />
            <span>Create from scratch</span>
          </button>
        </div>

        <div className="formation-onboarding__footer">
          <button
            onClick={onSkip}
            className="formation-onboarding__skip"
          >
            Skip for now
          </button>
          <button
            onClick={handleComplete}
            disabled={selectedSystem.size === 0 && selectedTeam.size === 0}
            className="formation-onboarding__import"
          >
            Import Selected ({selectedSystem.size + selectedTeam.size})
          </button>
        </div>
      </div>
    </div>
  )
}
