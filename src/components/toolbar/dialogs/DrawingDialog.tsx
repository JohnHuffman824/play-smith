import { X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { eventBus } from '../../../services/EventBus'
import type { Drawing } from '../../../types/drawing.types'

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

	const containerClass = [
		'absolute left-24 top-6 w-80 rounded-2xl shadow-2xl bg-card',
		'border border-border p-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto',
	].join(' ')
	const numberBadgeClass = [
		'w-8 h-8 rounded-lg bg-action-button text-action-button-foreground flex items-center',
		'justify-center flex-shrink-0 group-hover:scale-110 transition-transform font-semibold text-sm',
	].join(' ')
	const headerClass =
		'flex items-center justify-between mb-4 sticky top-0 pb-2 border-b border-border bg-card'
	const itemClass =
		'w-full p-3 rounded-xl border border-border bg-muted hover:bg-accent hover:border-action-button transition-all text-left group cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
	const closeButtonClass =
		'w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

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
			className={containerClass}>
			<div className={headerClass}>
				<span className="text-foreground">Add Drawing</span>
				<button
					onClick={onClose}
					className={closeButtonClass}
				>
					<X size={16} />
				</button>
			</div>

			{loading && (
				<div className='flex items-center justify-center py-8'>
					<Loader2 size={24} className="animate-spin text-muted-foreground" />
				</div>
			)}

			{error && (
				<div className="text-center py-8 text-destructive">
					{error}
				</div>
			)}

			{!loading && !error && (
				<div className='space-y-2'>
					{routes.map((route) => (
						<button
							key={route.id}
							onClick={() => handleDrawingSelect(route)}
							className={itemClass}
						>
							<div className='flex items-start gap-3'>
								<div className={numberBadgeClass}>
									{route.route_number ?? route.name.charAt(0).toUpperCase()}
								</div>
								<div className='flex-1 min-w-0'>
									<div className="text-foreground mb-1">
										{route.name}
									</div>
									<div className="text-xs text-muted-foreground">
										{/* Description from drawing_template or placeholder */}
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