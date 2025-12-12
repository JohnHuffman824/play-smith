# Task 5.1: SearchBar to Canvas Integration

## Overview
This task integrates the SearchBar component with the Canvas for real-time concept application.

## Implementation Required

### 1. Update PlaybookEditor Component
**File:** `src/components/playbook-editor/PlaybookEditor.tsx`

Add state management:
```typescript
const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
const [selectedConcepts, setSelectedConcepts] = useState<SelectedConcept[]>([])
```

### 2. Add SearchBar to PlaybookEditor
```typescript
import { SearchBar } from '../search/SearchBar'

// In render:
<SearchBar
  teamId={teamId}
  onSelect={handleConceptSelect}
  onRemove={handleConceptRemove}
  selectedFormation={selectedFormation}
  selectedConcepts={selectedConcepts}
/>
```

### 3. Handle Concept Selection
```typescript
function handleConceptSelect(item: any, type: 'formation' | 'concept') {
  if (type === 'formation') {
    setSelectedFormation(item)
    // Apply formation to canvas
    applyFormationToCanvas(item)
  } else {
    // Check for conflicts
    const conflict = checkConceptConflict(item)
    if (conflict) {
      setConflictDialog({
        isOpen: true,
        playerRole: conflict.role,
        existingConcept: conflict.existing.name,
        newConcept: item.name || `${item.role} ${item.template_name}`
      })
    } else {
      setSelectedConcepts([...selectedConcepts, item])
      applyConceptToCanvas(item)
    }
  }
}
```

### 4. Apply to Canvas
```typescript
function applyFormationToCanvas(formation: Formation) {
  // Update canvas player positions based on formation.positions
  // This should trigger canvas re-render with new positions
}

function applyConceptToCanvas(concept: SelectedConcept) {
  // If saved concept, load drawing_data from concept
  // If auto-composed, generate drawing from template + role
  // Apply to canvas drawing layer
}
```

### 5. Real-time Updates
Use `useEffect` to watch selectedConcepts and update canvas:
```typescript
useEffect(() => {
  if (!selectedFormation) return

  // Clear canvas
  // Apply formation
  // Apply each selected concept
  selectedConcepts.forEach(concept => {
    applyConceptToCanvas(concept)
  })
}, [selectedFormation, selectedConcepts])
```

## Status
- [x] SearchBar component created (Task 4.1)
- [ ] PlaybookEditor integration pending
- [ ] Canvas application logic pending
- [ ] Real-time updates pending

## Notes
- This task requires access to Canvas drawing API
- May need to update Canvas component to accept concept application commands
- Consider performance optimizations for multiple concept applications
