import { Grid, List } from 'lucide-react'
import './view-toggle.css'

interface ViewToggleProps {
	viewMode: 'grid' | 'list'
	onViewModeChange: (_mode: 'grid' | 'list') => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
	return (
		<div className="view-toggle" role="group" aria-label="View mode">
			<button
				onClick={() => onViewModeChange('grid')}
				className={`view-toggle-button ${viewMode === 'grid' ? 'view-toggle-button-active' : ''}`}
				aria-label="Grid View"
				aria-pressed={viewMode === 'grid'}
			>
				<Grid className="w-4 h-4" />
			</button>
			<button
				onClick={() => onViewModeChange('list')}
				className={`view-toggle-button ${viewMode === 'list' ? 'view-toggle-button-active' : ''}`}
				aria-label="List View"
				aria-pressed={viewMode === 'list'}
			>
				<List className="w-4 h-4" />
			</button>
		</div>
	)
}
