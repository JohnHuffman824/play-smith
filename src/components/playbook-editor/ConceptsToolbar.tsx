import { Plus } from 'lucide-react'
import './concepts-toolbar.css'

export type ConceptFilter =
	| 'all'
	| 'routes'
	| 'motions'
	| 'modifiers'
	| 'formations'
	| 'groups'

type ConceptsToolbarProps = {
	onNewConcept: () => void
	activeFilter: ConceptFilter
	onFilterChange: (filter: ConceptFilter) => void
}

const FILTERS = [
	{ id: 'all', label: 'All' },
	{ id: 'routes', label: 'Routes' },
	{ id: 'motions', label: 'Motions' },
	{ id: 'modifiers', label: 'Modifiers' },
	{ id: 'formations', label: 'Formations' },
	{ id: 'groups', label: 'Groups' },
] as const

export function ConceptsToolbar({
	onNewConcept,
	activeFilter,
	onFilterChange
}: ConceptsToolbarProps) {
	return (
		<div className="concepts-toolbar">
			<div className="concepts-toolbar-content">
				<button
					onClick={onNewConcept}
					className="concepts-toolbar-button concepts-toolbar-button-new"
				>
					<Plus className="concepts-toolbar-icon" />
					<span>New Concept</span>
				</button>

				<div className="concepts-toolbar-divider" />

				<div className="concepts-toolbar-filters">
					{FILTERS.map((filter) => (
						<button
							key={filter.id}
							onClick={() => onFilterChange(filter.id)}
							data-active={activeFilter === filter.id}
							className="concepts-toolbar-button concepts-toolbar-button-filter"
						>
							{filter.label}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
