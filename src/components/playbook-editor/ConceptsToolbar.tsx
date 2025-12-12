import { Plus } from 'lucide-react'

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

const BUTTON_ACTIVE =
	'bg-action-button text-action-button-foreground hover:bg-action-button/90'
const BUTTON_INACTIVE = 'border border-border hover:bg-accent'
const BUTTON_BASE =
	'px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer'

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
		<div className="border-b border-border bg-card px-6 py-3">
			<div className="flex items-center gap-4 flex-1">
				<button
					onClick={onNewConcept}
					className={`${BUTTON_BASE} ${BUTTON_ACTIVE}
						flex items-center gap-2`}
				>
					<Plus className="w-4 h-4" />
					<span>New Concept</span>
				</button>

				<div className="w-px h-6 bg-border" />

				<div className="flex items-center gap-2">
					{FILTERS.map((filter) => (
						<button
							key={filter.id}
							onClick={() => onFilterChange(filter.id)}
							className={`${BUTTON_BASE}
								${activeFilter === filter.id
									? BUTTON_ACTIVE
									: BUTTON_INACTIVE}`}
						>
							{filter.label}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
