import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import type { ConceptChip as ConceptChipType } from '../../types/concept.types'
import { ConceptChip } from './ConceptChip'
import { SearchDropdown } from './SearchDropdown'
import { useUnifiedSearch } from '../../hooks/useUnifiedSearch'
import { useConceptData } from '../../hooks/useConceptData'
import { useConcept } from '../../contexts/ConceptContext'
import './unified-search-bar.css'

interface UnifiedSearchBarProps {
	teamId: string
	playbookId?: string
	placeholder?: string
}

export function UnifiedSearchBar({
	teamId,
	playbookId,
	placeholder = 'Search formations, concepts, or groups...'
}: UnifiedSearchBarProps) {
	const [inputValue, setInputValue] = useState('')
	const [showDropdown, setShowDropdown] = useState(false)
	const [draggedChipId, setDraggedChipId] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const { state, applyConcept, removeConcept, reorderConcepts } = useConcept()
	const { formations, concepts, conceptGroups } = useConceptData(teamId, playbookId)
	const { query, setQuery, results, isSearching } = useUnifiedSearch(teamId, playbookId)

	useEffect(() => {
		setQuery(inputValue)
	}, [inputValue, setQuery])

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		setInputValue(e.target.value)
		setShowDropdown(true)
	}

	function handleInputFocus() {
		if (inputValue.trim()) {
			setShowDropdown(true)
		}
	}

	function handleSelect(
		type: 'formation' | 'concept' | 'concept_group',
		id: number,
		name: string
	) {
		const newChip: ConceptChipType = {
			id: `${type}-${id}-${Date.now()}`,
			type,
			label: name,
			entityId: id,
			entity:
				type === 'formation'
					? formations.find(f => f.id === id)
					: type === 'concept'
						? concepts.find(c => c.id === id)
						: conceptGroups.find(g => g.id === id)
		}

		applyConcept(newChip)
		setInputValue('')
		setShowDropdown(false)
		inputRef.current?.focus()
	}

	function handleChipDragStart(chipId: string) {
		setDraggedChipId(chipId)
	}

	function handleChipDragOver(e: React.DragEvent, targetChipId: string) {
		e.preventDefault()
		if (!draggedChipId || draggedChipId === targetChipId) return

		const draggedIndex = state.appliedConcepts.findIndex(c => c.id === draggedChipId)
		const targetIndex = state.appliedConcepts.findIndex(c => c.id === targetChipId)

		if (draggedIndex === -1 || targetIndex === -1) return

		const newChips = [...state.appliedConcepts]
		const [draggedChip] = newChips.splice(draggedIndex, 1)
		if (draggedChip) {
			newChips.splice(targetIndex, 0, draggedChip)
			reorderConcepts(newChips)
		}
	}

	function handleChipDragEnd() {
		setDraggedChipId(null)
	}

	return (
		<div ref={containerRef} className="unified-search-bar">
			<div className="unified-search-bar__input-wrapper">
				<Search className="unified-search-bar__icon" />

				<div className="unified-search-bar__chips">
					{state.appliedConcepts.map(chip => (
						<div
							key={chip.id}
							draggable
							onDragStart={() => handleChipDragStart(chip.id)}
							onDragOver={e => handleChipDragOver(e, chip.id)}
							onDragEnd={handleChipDragEnd}
						>
							<ConceptChip
								chip={chip}
								onRemove={removeConcept}
								isDragging={draggedChipId === chip.id}
							/>
						</div>
					))}

					<input
						ref={inputRef}
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						onFocus={handleInputFocus}
						placeholder={
							state.appliedConcepts.length === 0 ? placeholder : ''
						}
						className="unified-search-bar__input"
					/>
				</div>
			</div>

			{showDropdown && (
				<SearchDropdown
					results={results}
					isSearching={isSearching}
					query={inputValue}
					onSelect={handleSelect}
					onClose={() => setShowDropdown(false)}
				/>
			)}
		</div>
	)
}
