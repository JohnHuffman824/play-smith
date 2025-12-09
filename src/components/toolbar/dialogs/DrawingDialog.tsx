import { X } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'
import { eventBus } from '../../../services/EventBus'

interface DrawingDialogProps {
	onClose: () => void
}

const drawings = [
	{ number: 1, name: 'Flat', description: 'Quick horizontal route' },
	{ number: 2, name: 'Slant', description: 'Diagonal inside cut' },
	{ number: 3, name: 'Comeback', description: 'Out and back towards QB' },
	{ number: 4, name: 'Curl', description: 'Stop and turn back' },
	{ number: 5, name: 'Out', description: 'Break towards sideline' },
	{ number: 6, name: 'Dig', description: 'Deep in-breaking route' },
	{ number: 7, name: 'Corner', description: 'Deep break to corner' },
	{ number: 8, name: 'Post', description: 'Deep inside break' },
	{ number: 9, name: 'Go', description: 'Straight vertical route' },
]

/**
* Dialog for selecting predefined drawing templates.
*/
export function DrawingDialog({ onClose }: DrawingDialogProps) {
	const { theme } = useTheme()

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
		'justify-center flex-shrink-0 group-hover:scale-110 transition-transform',
	].join(' ')
	const subtitleClass =
		theme == 'dark' ? 'text-gray-400' : 'text-gray-500'
	const headerBaseClass =
		'flex items-center justify-between mb-4 sticky top-0 pb-2 border-b'
	const itemBaseClass =
		'w-full p-3 rounded-xl border transition-all text-left group cursor-pointer'
	const closeBaseClass =
		'w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer'

	function handleDrawingSelect(drawing: typeof drawings[0]) {
		eventBus.emit('drawing:add', { drawing })
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

			<div className='space-y-2'>
				{drawings.map((route) => (
					<button
						key={route.number}
						onClick={() => handleDrawingSelect(route)}
						className={`${itemBaseClass} ${itemClass}`}
					>
						<div className='flex items-start gap-3'>
							<div className={numberBadgeClass}>
								{route.number}
							</div>
							<div className='flex-1 min-w-0'>
								<div className={`${titleClass} mb-1`}>
									{route.name}
								</div>
								<div className={`text-xs ${subtitleClass}`}>
									{route.description}
								</div>
							</div>
						</div>
					</button>
				))}
			</div>
		</div>
	)
}