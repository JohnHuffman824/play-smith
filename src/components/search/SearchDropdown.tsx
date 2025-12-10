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
			<div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 p-4 text-center">
				<span className="text-gray-500 dark:text-gray-400">Searching...</span>
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
			<div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 p-4 text-center">
				<span className="text-gray-500 dark:text-gray-400">
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
		<div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
			{results.formations.length > 0 && (
				<div className="py-2">
					<div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
						Formations
					</div>
					{results.formations.map(result => (
						<button
							key={`formation-${result.id}`}
							onClick={() => handleSelect('formation', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">{result.name}</span>
								<span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
									Formation
								</span>
							</div>
						</button>
					))}
				</div>
			)}

			{results.concepts.length > 0 && (
				<div className="py-2 border-t border-gray-200 dark:border-gray-700">
					<div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
						Concepts
					</div>
					{results.concepts.map(result => (
						<button
							key={`concept-${result.id}`}
							onClick={() => handleSelect('concept', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">{result.name}</span>
								<span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
									Concept
								</span>
							</div>
						</button>
					))}
				</div>
			)}

			{results.groups.length > 0 && (
				<div className="py-2 border-t border-gray-200 dark:border-gray-700">
					<div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
						Concept Groups
					</div>
					{results.groups.map(result => (
						<button
							key={`group-${result.id}`}
							onClick={() => handleSelect('concept_group', result.id, result.name)}
							className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">{result.name}</span>
								<span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
									Group
								</span>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
