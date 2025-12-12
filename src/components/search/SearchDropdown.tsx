import type { SearchResults } from '../../types/concept.types'

interface SearchDropdownProps {
	results: SearchResults | null
	isSearching: boolean
	query: string
	onSelect: (type: 'formation' | 'concept' | 'concept_group', id: number, name: string) => void
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
			<div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center">
				<span className="text-muted-foreground">Searching...</span>
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
			<div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center">
				<span className="text-muted-foreground">
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
		<div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
			{results.formations.length > 0 && (
				<div className="py-2">
					<div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
						Formations
					</div>
					{results.formations.map(result => (
						<button
							key={`formation-${result.id}`}
							onClick={() => handleSelect('formation', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-3">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="w-12 h-9 object-cover rounded border border-border flex-shrink-0"
									/>
								)}
								<div className="flex items-center justify-between flex-1 min-w-0">
									<span className="text-sm font-medium truncate">{result.name}</span>
									<span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded ml-2 flex-shrink-0">
										Formation
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			)}

			{results.concepts.length > 0 && (
				<div className="py-2 border-t border-border">
					<div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
						Concepts
					</div>
					{results.concepts.map(result => (
						<button
							key={`concept-${result.id}`}
							onClick={() => handleSelect('concept', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-3">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="w-12 h-9 object-cover rounded border border-border flex-shrink-0"
									/>
								)}
								<div className="flex items-center justify-between flex-1 min-w-0">
									<span className="text-sm font-medium truncate">{result.name}</span>
									<span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded ml-2 flex-shrink-0">
										Concept
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			)}

			{results.groups.length > 0 && (
				<div className="py-2 border-t border-border">
					<div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
						Concept Groups
					</div>
					{results.groups.map(result => (
						<button
							key={`group-${result.id}`}
							onClick={() => handleSelect('concept_group', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-3">
								{result.thumbnail && (
									<img
										src={result.thumbnail}
										alt={result.name}
										className="w-12 h-9 object-cover rounded border border-border flex-shrink-0"
									/>
								)}
								<div className="flex items-center justify-between flex-1 min-w-0">
									<span className="text-sm font-medium truncate">{result.name}</span>
									<span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded ml-2 flex-shrink-0">
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
