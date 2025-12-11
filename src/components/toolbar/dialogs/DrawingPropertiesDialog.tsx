import { X } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'
import type { Drawing, PathStyle } from '../../../types/drawing.types'
import type { FieldCoordinateSystem } from '../../../utils/coordinates'

interface DrawingPropertiesDialogProps {
	drawing: Drawing
	position: { x: number; y: number }
	onUpdate: (updates: Partial<PathStyle>) => void
	onClose: () => void
	coordSystem: FieldCoordinateSystem
}

const DIALOG_WIDTH = 280
const DIALOG_MAX_HEIGHT = 550
const BACKDROP_Z_INDEX = 40
const DIALOG_Z_INDEX = 50

const brushSizes = [
	{ size: 2, label: 'Thin' },
	{ size: 3, label: 'Medium' },
	{ size: 5, label: 'Thick' },
	{ size: 7, label: 'Extra Thick' },
]

const colorPresets = [
	'#000000', // Black
	'#FFFFFF', // White
	'#EF4444', // Red
	'#F97316', // Orange
	'#F59E0B', // Amber
	'#10B981', // Green
	'#3B82F6', // Blue
	'#8B5CF6', // Purple
]

export function DrawingPropertiesDialog({
	drawing,
	position,
	onUpdate,
	onClose,
	coordSystem,
}: DrawingPropertiesDialogProps) {
	const { theme } = useTheme()
	const { style } = drawing

	// Position dialog near click, but keep on screen
	const dialogStyle = {
		position: 'fixed' as const,
		left: Math.min(position.x, window.innerWidth - DIALOG_WIDTH),
		top: Math.min(position.y, window.innerHeight - DIALOG_MAX_HEIGHT),
	}

	return (
		<>
			{/* Transparent backdrop to handle click-away */}
			<div
				className='fixed inset-0 z-[60]'
				onClick={onClose}
			/>
			<div
				style={dialogStyle}
				className={`w-64 rounded-2xl shadow-2xl border p-4 z-[70] ${
					theme === 'dark'
						? 'bg-gray-800 border-gray-700'
						: 'bg-white border-gray-200'
				}`}
			>
			{/* Header */}
			<div className='flex items-center justify-between mb-4'>
				<span
					className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}
				>
					Edit Drawing
				</span>
				<button
					onClick={onClose}
					className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer ${
						theme === 'dark'
							? 'hover:bg-gray-700 text-gray-400'
							: 'hover:bg-gray-100 text-gray-500'
					}`}
				>
					<X size={16} />
				</button>
			</div>

			{/* Color */}
			<div className='mb-4'>
				<label
					className={`block text-xs mb-2 ${
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Color
				</label>
				<div className='grid grid-cols-4 gap-2'>
					{colorPresets.map((color) => (
						<button
							key={color}
							onClick={() => onUpdate({ color })}
							className={`h-10 rounded-lg transition-all cursor-pointer ${
								style.color === color
									? 'ring-2 ring-blue-500 ring-offset-2'
									: `hover:scale-105 border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`
							}`}
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>
			</div>

			{/* Path Mode */}
			<div className='mb-4'>
				<label
					className={`block text-xs mb-2 ${
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Path Mode
				</label>
				<div className='flex gap-2'>
					<button
						onClick={() => onUpdate({ pathMode: 'sharp' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
							style.pathMode === 'sharp'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<svg viewBox='0 0 48 16' className='h-4 w-full'>
							<polyline
								points='4,12 16,4 32,12 44,4'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='miter'
							/>
						</svg>
					</button>
					<button
						onClick={() => onUpdate({ pathMode: 'curve' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
							style.pathMode === 'curve'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<svg viewBox='0 0 48 16' className='h-4 w-full'>
							<path
								d='M 4,12 C 10,4 22,4 24,8 C 26,12 38,12 44,4'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Line Style */}
			<div className='mb-4'>
				<label
					className={`block text-xs mb-2 ${
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Line Style
				</label>
				<div className='flex gap-2'>
					<button
						onClick={() => onUpdate({ lineStyle: 'solid' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
							style.lineStyle === 'solid'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<div className='h-0.5 bg-current mx-auto w-12' />
					</button>
					<button
						onClick={() => onUpdate({ lineStyle: 'dashed' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
							style.lineStyle === 'dashed'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<div className='h-0.5 mx-auto w-12 flex gap-1'>
							<div className='flex-1 bg-current' />
							<div className='flex-1 bg-current' />
							<div className='flex-1 bg-current' />
						</div>
					</button>
				</div>
			</div>

			{/* Line End */}
			<div className='mb-4'>
				<label
					className={`block text-xs mb-2 ${
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Line End
				</label>
				<div className='grid grid-cols-3 gap-2'>
					<button
						onClick={() => onUpdate({ lineEnd: 'none' })}
						className={`py-2 px-3 rounded-lg transition-all text-xs cursor-pointer ${
							style.lineEnd === 'none'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						None
					</button>
					<button
						onClick={() => onUpdate({ lineEnd: 'arrow' })}
						className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
							style.lineEnd === 'arrow'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<svg width='20' height='16' viewBox='0 0 20 16'>
							<line
								x1='2'
								y1='8'
								x2='11'
								y2='8'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
							<path d='M14 8l-4-4v8z' fill='currentColor' />
						</svg>
					</button>
					<button
						onClick={() => onUpdate({ lineEnd: 'tShape' })}
						className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
							style.lineEnd === 'tShape'
								? 'bg-blue-500 text-white'
								: theme === 'dark'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						<svg
							width='20'
							height='16'
							viewBox='0 0 20 16'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<path d='M14 4v8M2 8h12' />
						</svg>
					</button>
				</div>
			</div>

			{/* Thickness */}
			<div>
				<label
					className={`block text-xs mb-2 ${
						theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Line Thickness
				</label>
				<div className='grid grid-cols-2 gap-2'>
					{brushSizes.map((brush) => {
						// Convert pixel size to feet for storage
						const strokeWidthInFeet = brush.size / coordSystem.scale

						// Check if current style matches (compare in feet)
						const isSelected = Math.abs(style.strokeWidth - strokeWidthInFeet) < 0.01

						return (
							<button
								key={brush.size}
								onClick={() => onUpdate({ strokeWidth: strokeWidthInFeet })}
								className={`py-3 px-3 rounded-lg transition-all cursor-pointer ${
									isSelected
										? 'bg-blue-500 text-white'
										: theme === 'dark'
											? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								<div className='flex flex-col items-center gap-1'>
									<div
										className='bg-current rounded-full'
										style={{
											width: `${brush.size * 2}px`,
											height: `${brush.size * 2}px`,
										}}
									/>
									<span className='text-xs'>{brush.label}</span>
								</div>
							</button>
						)
					})}
				</div>
			</div>
		</div>
		</>
	)
}
