import { X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
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
	const { theme } = useTheme()
	const [routes, setRoutes] = useState<PresetRoute[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const containerClass = [
		'absolute left-24 top-6 w-80 rounded-2xl shadow-2xl',
		'border p-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto',
	].join(' ')
	const containerTheme =
		theme == 'dark'
			? 'bg-gray-800 border-gray-700'
			: 'bg-white border-gray-200'
	const headerTheme =
		theme == 'dark'
			? 'bg-gray-800 border-gray-700'
			: 'bg-white border-gray-100'
	const titleClass = theme == 'dark' ? 'text-gray-100' : 'text-gray-900'
	const closeButtonClass =
		theme == 'dark'
			? 'hover:bg-gray-700 text-gray-400'
			: 'hover:bg-gray-100 text-gray-500'
	const itemClass =
		theme == 'dark'
			? 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-blue-500'
			: 'bg-gray-50 hover:bg-blue-50 border-gray-100 hover:border-blue-200'
	const numberBadgeClass = [
		'w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center',
		'justify-center flex-shrink-0 group-hover:scale-110 transition-transform font-semibold text-sm',
	].join(' ')
	const subtitleClass =
		theme == 'dark' ? 'text-gray-400' : 'text-gray-500'
	const headerBaseClass =
		'flex items-center justify-between mb-4 sticky top-0 pb-2 border-b'
	const itemBaseClass =
		'w-full p-3 rounded-xl border transition-all text-left group cursor-pointer'
	const closeBaseClass =
		'w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer'

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
			className={`${containerClass} ${containerTheme}`}>
			<div
				className={`${headerBaseClass} ${headerTheme}`}
			>
				<span className={titleClass}>Add Drawing</span>
				<button
					onClick={onClose}
					className={`${closeBaseClass} ${closeButtonClass}`}
				>
					<X size={16} />
				</button>
			</div>

			{loading && (
				<div className='flex items-center justify-center py-8'>
					<Loader2 size={24} className={`animate-spin ${theme == 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
				</div>
			)}

			{error && (
				<div className={`text-center py-8 ${theme == 'dark' ? 'text-red-400' : 'text-red-600'}`}>
					{error}
				</div>
			)}

			{!loading && !error && (
				<div className='space-y-2'>
					{routes.map((route) => (
						<button
							key={route.id}
							onClick={() => handleDrawingSelect(route)}
							className={`${itemBaseClass} ${itemClass}`}
						>
							<div className='flex items-start gap-3'>
								<div className={numberBadgeClass}>
									{route.route_number ?? route.name.charAt(0).toUpperCase()}
								</div>
								<div className='flex-1 min-w-0'>
									<div className={`${titleClass} mb-1`}>
										{route.name}
									</div>
									<div className={`text-xs ${subtitleClass}`}>
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