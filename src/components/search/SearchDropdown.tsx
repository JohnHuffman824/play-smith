import type { SearchResults } from '../../types/concept.types'
import './search-dropdown.css'

interface SearchDropdownProps {
	results: SearchResults | null
	isSearching: boolean
	query: string
	onSelect: (_type: 'formation' | 'concept' | 'concept_group', _id: number, _name: string) => void
	onClose: () => void
}

export function SearchDropdown({
	results,
	isSearching,
	query,
	onSelect,
	onClose
}: SearchDropdownProps) {
	if (!query.trim()) return null

	if (isSearching) {
		return (
			<div className="search-dropdown search-dropdown--loading">
				<span className="search-dropdown__empty-text">Searching...</span>
			</div>
		)
	}

	if (!results) return null

	const hasResults =
		results.formations.length > 0 ||
		results.concepts.length > 0 ||
		results.groups.length > 0

	if (!hasResults) {
		return (
			<div className="search-dropdown search-dropdown--empty">
				<span className="search-dropdown__empty-text">
					No results found for "{query}"
				</span>
			</div>
		)
	}

	function handleSelect(
		type: 'formation' | 'concept' | 'concept_group',
		id: number,
		name: string
	) {
		onSelect(type, id, name)
		onClose()
	}

	return (
		<div className="search-dropdown">
			{results.formations.length > 0 && (
				<div className="search-dropdown__section">
					<div className="search-dropdown__section-title">
						Formations
					</div>
					{results.formations.map(result => (
						<button
							key={`formation-${result.id}`}
							onClick={() => handleSelect('formation', result.id, result.name)}
							className="search-dropdown__item"
						>
							<div className="search-dropdown__item-content">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="search-dropdown__thumbnail"
									/>
								)}
								<div className="search-dropdown__item-text">
									<span className="search-dropdown__item-name">{result.name}</span>
									<span className="search-dropdown__item-badge">
										Formation
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			)}

			{results.concepts.length > 0 && (
				<div className="search-dropdown__section">
					<div className="search-dropdown__section-title">
						Concepts
					</div>
					{results.concepts.map(result => (
						<button
							key={`concept-${result.id}`}
							onClick={() => handleSelect('concept', result.id, result.name)}
							className="search-dropdown__item"
						>
							<div className="search-dropdown__item-content">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="search-dropdown__thumbnail"
									/>
								)}
								<div className="search-dropdown__item-text">
									<span className="search-dropdown__item-name">{result.name}</span>
									<span className="search-dropdown__item-badge">
										Concept
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			)}

			{results.groups.length > 0 && (
				<div className="search-dropdown__section">
					<div className="search-dropdown__section-title">
						Concept Groups
					</div>
					{results.groups.map(result => (
						<button
							key={`group-${result.id}`}
							onClick={() => handleSelect('concept_group', result.id, result.name)}
							className="search-dropdown__item"
						>
							<div className="search-dropdown__item-content">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="search-dropdown__thumbnail"
									/>
								)}
								<div className="search-dropdown__item-text">
									<span className="search-dropdown__item-name">{result.name}</span>
									<span className="search-dropdown__item-badge">
										Group
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
