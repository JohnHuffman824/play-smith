import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { eventBus } from '../../../services/EventBus'
import type { Drawing } from '../../../types/drawing.types'
import { DialogCloseButton } from '../../ui/dialog-close-button'
import './drawing-dialog.css'

interface DrawingDialogProps {
	onClose: () => void
}

interface PresetRoute {
	id: number
	team_id: number | null
	name: string
	route_number: number | null
	drawing_template: Drawing
	created_by: number | null
	created_at: string
	updated_at: string
}

/**
* Dialog for selecting predefined drawing templates.
*/
export function DrawingDialog({ onClose }: DrawingDialogProps) {
	const [routes, setRoutes] = useState<PresetRoute[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchRoutes() {
			try {
				setLoading(true)
				const response = await fetch('/api/preset-routes')
				if (!response.ok) {
					throw new Error('Failed to fetch routes')
				}
				const data = await response.json()

				// Sort routes: numbered first (1-9), then unnumbered alphabetically
				const sortedRoutes = sortRoutes(data.routes)
				setRoutes(sortedRoutes)
				setError(null)
			} catch (err) {
				console.error('Error fetching routes:', err)
				setError('Failed to load routes')
			} finally {
				setLoading(false)
			}
		}

		fetchRoutes()
	}, [])

	function sortRoutes(routes: PresetRoute[]): PresetRoute[] {
		const numbered = routes.filter(r => r.route_number != null)
			.sort((a, b) => a.route_number! - b.route_number!)
		const unnumbered = routes.filter(r => r.route_number == null)
			.sort((a, b) => a.name.localeCompare(b.name))
		return [...numbered, ...unnumbered]
	}

	function handleDrawingSelect(route: PresetRoute) {
		eventBus.emit('drawing:add', { drawing: route.drawing_template })
		onClose()
	}

	return (
		<div
			data-drawing-dialog
			className="drawing-dialog">
			<div className="drawing-dialog-header">
				<span className="drawing-dialog-title">Add Drawing</span>
				<DialogCloseButton onClose={onClose} />
			</div>

			{loading && (
				<div className="drawing-dialog-loading">
					<Loader2 size={24} className="drawing-dialog-loading-spinner animate-spin" />
				</div>
			)}

			{error && (
				<div className="drawing-dialog-error">
					{error}
				</div>
			)}

			{!loading && !error && (
				<div className="drawing-dialog-list">
					{routes.map((route) => (
						<button
							key={route.id}
							onClick={() => handleDrawingSelect(route)}
							className="drawing-dialog-item"
						>
							<div className="drawing-dialog-item-content">
								<div className="drawing-dialog-item-badge">
									{route.route_number ?? route.name.charAt(0).toUpperCase()}
								</div>
								<div className="drawing-dialog-item-details">
									<div className="drawing-dialog-item-name">
										{route.name}
									</div>
									<div className="drawing-dialog-item-description">
										{route.route_number ? `Route ${route.route_number}` : 'Special route'}
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}