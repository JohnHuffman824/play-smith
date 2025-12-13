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

type SearchResultItem = Formation | SelectedConcept

interface SearchBarProps {
  teamId: string
  onSelect: (_item: SearchResultItem, _type: 'formation' | 'concept') => void
  onRemove?: (_item: SearchResultItem, _type: 'formation' | 'concept') => void
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
  const [results, setResults] = useState<unknown>(null)
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

  function handleSelect(item: SearchResultItem, type: 'formation' | 'concept') {
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
      {isOpen && results && (() => {
        const resultsData = results as { results?: { formations?: Formation[]; concepts?: (SelectedConcept & { is_motion?: boolean; is_modifier?: boolean })[] }; parseResult?: Record<string, unknown> }
        return (
          <div className="search-bar-dropdown">
            {/* Formation results */}
            {resultsData.results?.formations?.map((f: Formation) => (
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
            {resultsData.results?.concepts?.map((c) => (
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
            {(resultsData.parseResult as { type?: string; composition?: SelectedConcept })?.type === 'composition' && (
              <button
                className="search-bar-dropdown-item search-bar-dropdown-divider"
                onClick={() => handleSelect((resultsData.parseResult as { composition: SelectedConcept }).composition, 'concept')}
              >
                <span className="search-bar-dropdown-label">
                  {(resultsData.parseResult as { composition: { role?: string; template_name?: string } }).composition.role} {(resultsData.parseResult as { composition: { role?: string; template_name?: string } }).composition.template_name}
                </span>
                <span className="search-bar-dropdown-type">Auto-compose (unsaved)</span>
              </button>
            )}

            {/* Needs role prompt */}
            {(resultsData.parseResult as { type?: string })?.type === 'needs_role' && (
              <div className="search-bar-dropdown-divider">
                <span className="search-bar-dropdown-prompt">
                  Apply "{(resultsData.parseResult as { template_name?: string }).template_name}" to which player?
                </span>
                <div className="search-bar-dropdown-roles">
                  {((resultsData.parseResult as { availableRoles?: string[] }).availableRoles || []).slice(0, 5).map((role: string) => (
                    <button
                      key={role}
                      className="search-bar-role-button"
                      onClick={() => handleSelect({
                        role,
                        template_name: (resultsData.parseResult as { template_name?: string }).template_name,
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
            {(resultsData.parseResult as { type?: string })?.type === 'no_match' && query && (
              <div className="search-bar-dropdown-divider search-bar-dropdown-prompt">
                No match found. <button className="search-bar-create-link">Create new concept?</button>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
