# Task 5.3: Conflict Detection Integration

## Overview
This task adds conflict detection when applying routes and displays the ConflictDialog.

## Implementation Required

### 1. Create useConceptApplication Hook
**File:** `src/hooks/useConceptApplication.ts`

```typescript
import { useState } from 'react'

interface ConceptConflict {
  role: string
  existing: { name: string; id?: number }
  new: { name: string; id?: number }
}

export function useConceptApplication() {
  const [conflict, setConflict] = useState<ConceptConflict | null>(null)
  const [pendingConcept, setPendingConcept] = useState<any>(null)

  function checkConflict(
    newConcept: SelectedConcept,
    appliedConcepts: SelectedConcept[]
  ): ConceptConflict | null {
    // Determine which role this concept targets
    const targetRole = newConcept.role || extractRoleFromConcept(newConcept)

    if (!targetRole) return null

    // Check if there's already a concept for this role
    const existing = appliedConcepts.find(c => {
      const existingRole = c.role || extractRoleFromConcept(c)
      return existingRole === targetRole
    })

    if (existing) {
      return {
        role: targetRole,
        existing: {
          name: existing.name || `${existing.role} ${existing.template_name}`,
          id: existing.id
        },
        new: {
          name: newConcept.name || `${newConcept.role} ${newConcept.template_name}`,
          id: newConcept.id
        }
      }
    }

    return null
  }

  function extractRoleFromConcept(concept: any): string | null {
    // For absolute_role concepts, extract role from assignments
    // For relative_selector concepts, may need formation context
    if (concept.role) return concept.role

    // Parse from concept data if needed
    return null
  }

  function handleApply(concept: any, appliedConcepts: any[], onConfirm: (c: any) => void) {
    const conflictDetected = checkConflict(concept, appliedConcepts)

    if (conflictDetected) {
      setConflict(conflictDetected)
      setPendingConcept({ concept, onConfirm })
    } else {
      onConfirm(concept)
    }
  }

  function handleReplace() {
    if (pendingConcept) {
      // Remove existing concept for the role
      // Apply new concept
      pendingConcept.onConfirm(pendingConcept.concept)
    }
    setConflict(null)
    setPendingConcept(null)
  }

  function handleCancel() {
    setConflict(null)
    setPendingConcept(null)
  }

  return {
    conflict,
    handleApply,
    handleReplace,
    handleCancel
  }
}
```

### 2. Integrate with PlaybookEditor
**File:** `src/components/playbook-editor/PlaybookEditor.tsx`

```typescript
import { useConceptApplication } from '../../hooks/useConceptApplication'
import { ConflictDialog } from '../concepts/ConflictDialog'

function PlaybookEditor() {
  const { conflict, handleApply, handleReplace, handleCancel } = useConceptApplication()

  function handleConceptSelect(concept: any) {
    handleApply(concept, selectedConcepts, (confirmedConcept) => {
      // Apply to canvas
      setSelectedConcepts([...selectedConcepts, confirmedConcept])
      applyConceptToCanvas(confirmedConcept)
    })
  }

  return (
    <>
      {/* ... other components ... */}

      <ConflictDialog
        isOpen={!!conflict}
        playerRole={conflict?.role || ''}
        existingConcept={conflict?.existing.name || ''}
        newConcept={conflict?.new.name || ''}
        onReplace={handleReplace}
        onCancel={handleCancel}
      />
    </>
  )
}
```

### 3. Advanced: Multi-Player Concepts
For concepts that target multiple players (relative selectors):
```typescript
function checkConflict(
  newConcept: SelectedConcept,
  appliedConcepts: SelectedConcept[],
  formation: Formation
): ConceptConflict[] {
  const conflicts: ConceptConflict[] = []

  // Resolve which players this concept targets
  const targetedRoles = resolveTargetedRoles(newConcept, formation)

  // Check each targeted role for conflicts
  for (const role of targetedRoles) {
    const existing = appliedConcepts.find(c =>
      resolveTargetedRoles(c, formation).includes(role)
    )

    if (existing) {
      conflicts.push({
        role,
        existing: { name: existing.name || '...', id: existing.id },
        new: { name: newConcept.name || '...', id: newConcept.id }
      })
    }
  }

  return conflicts
}
```

### 4. Conflict Resolution Strategies
```typescript
enum ConflictResolution {
  REPLACE = 'replace',      // Replace existing with new
  KEEP = 'keep',            // Keep existing, discard new
  MERGE = 'merge',          // Merge both (if compatible)
  ASK = 'ask'               // Show dialog
}
```

## Status
- [x] ConflictDialog component created (Task 4.2)
- [ ] useConceptApplication hook pending
- [ ] PlaybookEditor integration pending
- [ ] Role resolution logic pending
- [ ] Multi-player conflict handling pending

## Notes
- Need to handle both absolute_role and relative_selector concepts
- Should track which roles are "occupied" by which concepts
- Consider allowing multiple concepts per role if non-conflicting (e.g., motion + route)
- May need formation context to resolve relative selectors
