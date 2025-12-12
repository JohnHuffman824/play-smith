import { useState, useCallback, useEffect } from 'react'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'

interface Formation {
  id: number
  name: string
}

interface SelectedConcept {
  id?: number
  name?: string
  role?: string
  template_name?: string
  is_saved: boolean
}

interface SearchBarProps {
  teamId: string
  onSelect: (item: any, type: 'formation' | 'concept') => void
  onRemove?: (item: any, type: 'formation' | 'concept') => void
  selectedFormation?: Formation | null
  selectedConcepts?: SelectedConcept[]
}

export function SearchBar({
  teamId,
  onSelect,
  onRemove,
  selectedFormation,
  selectedConcepts = []
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  const stage = selectedFormation ? 'open' : 'formation_select'
  const placeholder = selectedFormation
    ? 'Add concepts, routes, motions...'
    : 'Select a formation...'

  const fetchResults = useCallback(async () => {
    if (!debouncedQuery) {
      setResults(null)
      return
    }

    const response = await fetch(
      `/api/search?q=${encodeURIComponent(debouncedQuery)}&stage=${stage}&teamId=${teamId}`
    )
    const data = await response.json()
    setResults(data)
  }, [debouncedQuery, stage, teamId])

  // Fetch on debounced query change
  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  function handleSelect(item: any, type: 'formation' | 'concept') {
    onSelect(item, type)
    setQuery('')
    setResults(null)
    setIsOpen(false)
  }

  function getConceptDisplayName(concept: SelectedConcept): string {
    if (concept.name) return concept.name
    if (concept.role && concept.template_name) {
      return `${concept.role} ${concept.template_name}${concept.is_saved ? '' : '*'}`
    }
    return 'Unknown'
  }

  return (
    <div className="relative">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedFormation && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {selectedFormation.name}
            {onRemove && (
              <button onClick={() => onRemove(selectedFormation, 'formation')}>
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        )}
        {selectedConcepts.map((concept, i) => (
          <Badge
            key={concept.id || i}
            variant={concept.is_saved ? 'default' : 'outline'}
            className="flex items-center gap-1"
          >
            {getConceptDisplayName(concept)}
            {onRemove && (
              <button onClick={() => onRemove(concept, 'concept')}>
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Search input */}
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />

      {/* Results dropdown */}
      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
          {/* Formation results */}
          {results.results.formations?.map((f: any) => (
            <button
              key={f.id}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => handleSelect(f, 'formation')}
            >
              <span className="font-medium">{f.name}</span>
              <span className="text-sm text-muted-foreground ml-2">Formation</span>
            </button>
          ))}

          {/* Concept results */}
          {results.results.concepts?.map((c: any) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => handleSelect({ ...c, is_saved: true }, 'concept')}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {c.is_motion ? 'Motion' : c.is_modifier ? 'Modifier' : 'Concept'}
              </span>
            </button>
          ))}

          {/* Composition suggestion */}
          {results.parseResult?.type === 'composition' && (
            <button
              className="w-full text-left px-3 py-2 hover:bg-accent border-t border-border transition-colors cursor-pointer"
              onClick={() => handleSelect(results.parseResult.composition, 'concept')}
            >
              <span className="font-medium">
                {results.parseResult.composition.role} {results.parseResult.composition.template_name}
              </span>
              <span className="text-sm text-muted-foreground ml-2">Auto-compose (unsaved)</span>
            </button>
          )}

          {/* Needs role prompt */}
          {results.parseResult?.type === 'needs_role' && (
            <div className="px-3 py-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Apply "{results.parseResult.template_name}" to which player?
              </span>
              <div className="flex gap-2 mt-1">
                {results.parseResult.availableRoles?.slice(0, 5).map((role: string) => (
                  <button
                    key={role}
                    className="px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors cursor-pointer"
                    onClick={() => handleSelect({
                      role,
                      template_name: results.parseResult.template_name,
                      is_saved: false
                    }, 'concept')}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No match */}
          {results.parseResult?.type === 'no_match' && query && (
            <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border">
              No match found. <button className="text-action-button hover:underline cursor-pointer">Create new concept?</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
