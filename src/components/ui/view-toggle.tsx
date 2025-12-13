import { Grid, List } from 'lucide-react'
import './view-toggle.css'

interface ViewToggleProps {
	viewMode: 'grid' | 'list'
	onViewModeChange: (mode: 'grid' | 'list') => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
	return (
		<div className="view-toggle">
			<button
				onClick={() => onViewModeChange('grid')}
				className={`view-toggle-button ${
					viewMode === 'grid' ? 'view-toggle-button-active' : 'view-toggle-button-inactive'
				}`}
				title="Grid View"
				aria-label="Grid View"
			>
				<Grid className="w-4 h-4" />
			</button>
			<button
				onClick={() => onViewModeChange('list')}
				className={`view-toggle-button ${
					viewMode === 'list' ? 'view-toggle-button-active' : 'view-toggle-button-inactive'
				}`}
				title="List View"
				aria-label="List View"
			>
				<List className="w-4 h-4" />
			</button>
		</div>
	)
}
