# Task 5.2: Formation Onboarding Integration

## Overview
This task integrates the FormationOnboardingDialog into the playbook creation flow.

## Implementation Required

### 1. Update PlaybookPage Component
**File:** `src/pages/PlaybookPage.tsx` or equivalent

Add state for onboarding dialog:
```typescript
const [showFormationOnboarding, setShowFormationOnboarding] = useState(false)
const [newPlaybookId, setNewPlaybookId] = useState<number | null>(null)
```

### 2. Check for Formations on Playbook Create
```typescript
async function handleCreatePlaybook(name: string) {
  // Create playbook
  const playbook = await createPlaybook({ name, teamId })

  // Check if team has any formations
  const formations = await fetchTeamFormations(teamId)

  if (formations.length === 0) {
    // Show onboarding dialog
    setNewPlaybookId(playbook.id)
    setShowFormationOnboarding(true)
  } else {
    // Navigate to playbook
    navigateToPlaybook(playbook.id)
  }
}
```

### 3. Add FormationOnboardingDialog
```typescript
import { FormationOnboardingDialog } from '../components/playbook/FormationOnboardingDialog'
import { SYSTEM_FORMATIONS } from '../db/seeds/system_formations'

<FormationOnboardingDialog
  isOpen={showFormationOnboarding}
  systemFormations={SYSTEM_FORMATIONS}
  teamFormations={teamFormations}
  onComplete={handleFormationsSelected}
  onSkip={handleSkipOnboarding}
/>
```

### 4. Handle Formation Import
```typescript
async function handleFormationsSelected(formations: SystemFormation[]) {
  // Create formations for the team
  for (const formation of formations) {
    await createFormation({
      teamId,
      name: formation.name,
      description: formation.description,
      positions: formation.positions
    })
  }

  setShowFormationOnboarding(false)

  // Navigate to playbook
  if (newPlaybookId) {
    navigateToPlaybook(newPlaybookId)
  }
}

function handleSkipOnboarding() {
  setShowFormationOnboarding(false)

  // Navigate to playbook anyway
  if (newPlaybookId) {
    navigateToPlaybook(newPlaybookId)
  }
}
```

### 5. Alternative: Show on First Visit
Could also trigger onboarding when user first accesses a playbook with no formations:
```typescript
useEffect(() => {
  if (playbookId && teamFormations.length === 0 && !hasSeenOnboarding) {
    setShowFormationOnboarding(true)
    setHasSeenOnboarding(true) // Store in localStorage
  }
}, [playbookId, teamFormations])
```

## Status
- [x] FormationOnboardingDialog component created (Task 4.3)
- [x] System formations seed data created (Task 1.2)
- [ ] PlaybookPage integration pending
- [ ] Formation creation API integration pending
- [ ] Navigation logic pending

## Notes
- Should only show once per team (not per playbook)
- Consider adding "Don't show again" option
- May want to allow re-triggering from settings
- Import API should handle bulk creation efficiently
