import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import type { Formation, BaseConcept, ConceptGroup } from '../../types/concept.types'

interface AddConceptSubDialogProps {
	isOpen: boolean
	onClose: () => void
	formations: Formation[]
	concepts: BaseConcept[]
	conceptGroups: ConceptGroup[]
	onSelectFormation: (formation: Formation) => void
	onSelectConcept: (concept: BaseConcept) => void
	onSelectGroup: (group: ConceptGroup) => void
	onCreateNew: () => void
}

export function AddConceptSubDialog({
	isOpen,
	onClose,
	formations,
	concepts,
	conceptGroups,
	onSelectFormation,
	onSelectConcept,
	onSelectGroup,
	onCreateNew
}: AddConceptSubDialogProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [activeTab, setActiveTab] = useState<'formations' | 'concepts' | 'groups'>('concepts')

	if (!isOpen) return null

	const filteredFormations = formations.filter(f =>
		f.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const filteredConcepts = concepts.filter(c =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const filteredGroups = conceptGroups.filter(g =>
		g.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	function handleSelect(
		type: 'formation' | 'concept' | 'group',
		item: Formation | BaseConcept | ConceptGroup
	) {
		if (type === 'formation') {
			onSelectFormation(item as Formation)
		} else if (type === 'concept') {
			onSelectConcept(item as BaseConcept)
		} else {
			onSelectGroup(item as ConceptGroup)
		}
		onClose()
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] max-h-[700px] flex flex-col">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600">
					<h3 className="text-lg font-semibold mb-4">Add Concept</h3>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder="Search..."
							className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
							autoFocus
						/>
					</div>

					{/* Tabs */}
					<div className="flex gap-2 mt-4">
						<button
							onClick={() => setActiveTab('formations')}
							className={`
								px-4 py-2 rounded-md text-sm font-medium transition-colors
								${activeTab === 'formations'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
								}
							`}
						>
							Formations ({filteredFormations.length})
						</button>
						<button
							onClick={() => setActiveTab('concepts')}
							className={`
								px-4 py-2 rounded-md text-sm font-medium transition-colors
								${activeTab === 'concepts'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
								}
							`}
						>
							Concepts ({filteredConcepts.length})
						</button>
						<button
							onClick={() => setActiveTab('groups')}
							className={`
								px-4 py-2 rounded-md text-sm font-medium transition-colors
								${activeTab === 'groups'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
								}
							`}
						>
							Groups ({filteredGroups.length})
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					{activeTab === 'formations' && (
						<div className="space-y-2">
							{filteredFormations.length === 0 ? (
								<div className="text-center py-8 text-gray-500 dark:text-gray-400">
									No formations found
								</div>
							) : (
								filteredFormations.map(formation => (
									<button
										key={formation.id}
										onClick={() => handleSelect('formation', formation)}
										className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									>
										<div className="font-medium">{formation.name}</div>
										{formation.description && (
											<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												{formation.description}
											</div>
										)}
									</button>
								))
							)}
						</div>
					)}

					{activeTab === 'concepts' && (
						<div className="space-y-2">
							{filteredConcepts.length === 0 ? (
								<div className="text-center py-8 text-gray-500 dark:text-gray-400">
									No concepts found
								</div>
							) : (
								filteredConcepts.map(concept => (
									<button
										key={concept.id}
										onClick={() => handleSelect('concept', concept)}
										className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									>
										<div className="flex items-center justify-between">
											<div className="font-medium">{concept.name}</div>
											<span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
												{concept.targeting_mode === 'absolute_role' ? 'Role' : 'Selector'}
											</span>
										</div>
										{concept.description && (
											<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												{concept.description}
											</div>
										)}
									</button>
								))
							)}
						</div>
					)}

					{activeTab === 'groups' && (
						<div className="space-y-2">
							{filteredGroups.length === 0 ? (
								<div className="text-center py-8 text-gray-500 dark:text-gray-400">
									No concept groups found
								</div>
							) : (
								filteredGroups.map(group => (
									<button
										key={group.id}
										onClick={() => handleSelect('group', group)}
										className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									>
										<div className="font-medium">{group.name}</div>
										{group.description && (
											<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												{group.description}
											</div>
										)}
										{group.formation && (
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												Formation: {group.formation.name}
											</div>
										)}
									</button>
								))
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
					<button
						onClick={() => {
							onCreateNew()
							onClose()
						}}
						className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Create New Concept
					</button>

					<button
						onClick={onClose}
						className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}
