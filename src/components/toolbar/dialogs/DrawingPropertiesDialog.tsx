import type { Drawing, PathStyle } from '../../../types/drawing.types'
import type { FieldCoordinateSystem } from '../../../utils/coordinates'
import { DialogCloseButton } from '../../ui/dialog-close-button'

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
				className="w-64 rounded-2xl shadow-2xl bg-popover border border-border p-4 z-[70]"
			>
			{/* Header */}
			<div className='flex items-center justify-between mb-4'>
				<span className="text-foreground">
					Edit Drawing
				</span>
				<DialogCloseButton onClose={onClose} />
			</div>

			{/* Color */}
			<div className='mb-4'>
				<label className="block text-xs mb-2 text-muted-foreground">
					Color
				</label>
				<div className='grid grid-cols-4 gap-2'>
					{colorPresets.map((color) => (
						<button
							key={color}
							onClick={() => onUpdate({ color })}
							className={`h-10 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
								style.color === color
									? 'ring-2 ring-action-button ring-offset-2'
									: 'hover:scale-105 border border-border'
							}`}
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>
			</div>

			{/* Path Mode */}
			<div className='mb-4'>
				<label className="block text-xs mb-2 text-muted-foreground">
					Path Mode
				</label>
				<div className='flex gap-2'>
					<button
						onClick={() => onUpdate({ pathMode: 'sharp' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.pathMode === 'sharp'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
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
						className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.pathMode === 'curve'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
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
				<label className="block text-xs mb-2 text-muted-foreground">
					Line Style
				</label>
				<div className='flex gap-2'>
					<button
						onClick={() => onUpdate({ lineStyle: 'solid' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.lineStyle === 'solid'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
						}`}
					>
						<div className='h-0.5 bg-current mx-auto w-12' />
					</button>
					<button
						onClick={() => onUpdate({ lineStyle: 'dashed' })}
						className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.lineStyle === 'dashed'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
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
				<label className="block text-xs mb-2 text-muted-foreground">
					Line End
				</label>
				<div className='grid grid-cols-3 gap-2'>
					<button
						onClick={() => onUpdate({ lineEnd: 'none' })}
						className={`py-2 px-3 rounded-lg transition-all duration-200 text-xs cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.lineEnd === 'none'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
						}`}
					>
						None
					</button>
					<button
						onClick={() => onUpdate({ lineEnd: 'arrow' })}
						className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.lineEnd === 'arrow'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
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
						className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
							style.lineEnd === 'tShape'
								? 'bg-action-button text-action-button-foreground'
								: 'bg-muted text-foreground hover:bg-accent'
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
				<label className="block text-xs mb-2 text-muted-foreground">
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
								className={`py-3 px-3 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
									isSelected
										? 'bg-action-button text-action-button-foreground'
										: 'bg-muted text-foreground hover:bg-accent'
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
