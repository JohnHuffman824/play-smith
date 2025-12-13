import { useState, useCallback, useEffect } from 'react'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import './search-bar.css'

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
    <div className="search-bar">
      {/* Selected chips */}
      <div className="search-bar-chips">
        {selectedFormation && (
          <Badge variant="secondary" className="search-bar-chip">
            {selectedFormation.name}
            {onRemove && (
              <button className="search-bar-chip-remove" onClick={() => onRemove(selectedFormation, 'formation')} aria-label={`Remove ${selectedFormation.name}`}>
                <X className="search-bar-chip-icon" />
              </button>
            )}
          </Badge>
        )}
        {selectedConcepts.map((concept, i) => (
          <Badge
            key={concept.id || i}
            variant={concept.is_saved ? 'default' : 'outline'}
            className="search-bar-chip"
          >
            {getConceptDisplayName(concept)}
            {onRemove && (
              <button className="search-bar-chip-remove" onClick={() => onRemove(concept, 'concept')} aria-label={`Remove ${getConceptDisplayName(concept)}`}>
                <X className="search-bar-chip-icon" />
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
        <div className="search-bar-dropdown">
          {/* Formation results */}
          {results.results.formations?.map((f: any) => (
            <button
              key={f.id}
              className="search-bar-dropdown-item"
              onClick={() => handleSelect(f, 'formation')}
            >
              <span className="search-bar-dropdown-label">{f.name}</span>
              <span className="search-bar-dropdown-type">Formation</span>
            </button>
          ))}

          {/* Concept results */}
          {results.results.concepts?.map((c: any) => (
            <button
              key={c.id}
              className="search-bar-dropdown-item"
              onClick={() => handleSelect({ ...c, is_saved: true }, 'concept')}
            >
              <span className="search-bar-dropdown-label">{c.name}</span>
              <span className="search-bar-dropdown-type">
                {c.is_motion ? 'Motion' : c.is_modifier ? 'Modifier' : 'Concept'}
              </span>
            </button>
          ))}

          {/* Composition suggestion */}
          {results.parseResult?.type === 'composition' && (
            <button
              className="search-bar-dropdown-item search-bar-dropdown-divider"
              onClick={() => handleSelect(results.parseResult.composition, 'concept')}
            >
              <span className="search-bar-dropdown-label">
                {results.parseResult.composition.role} {results.parseResult.composition.template_name}
              </span>
              <span className="search-bar-dropdown-type">Auto-compose (unsaved)</span>
            </button>
          )}

          {/* Needs role prompt */}
          {results.parseResult?.type === 'needs_role' && (
            <div className="search-bar-dropdown-divider">
              <span className="search-bar-dropdown-prompt">
                Apply "{results.parseResult.template_name}" to which player?
              </span>
              <div className="search-bar-dropdown-roles">
                {results.parseResult.availableRoles?.slice(0, 5).map((role: string) => (
                  <button
                    key={role}
                    className="search-bar-role-button"
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
            <div className="search-bar-dropdown-divider search-bar-dropdown-prompt">
              No match found. <button className="search-bar-create-link">Create new concept?</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
