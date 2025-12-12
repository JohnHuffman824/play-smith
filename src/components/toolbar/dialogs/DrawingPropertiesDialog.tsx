import type { Drawing, PathStyle } from '../../../types/drawing.types'
import type { FieldCoordinateSystem } from '../../../utils/coordinates'
import { DialogCloseButton } from '../../ui/dialog-close-button'
import './drawing-properties-dialog.css'

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
				className="drawing-properties-dialog-backdrop"
				onClick={onClose}
			/>
			<div
				style={dialogStyle}
				className="drawing-properties-dialog"
			>
			{/* Header */}
			<div className="drawing-properties-dialog-header">
				<span className="drawing-properties-dialog-title">
					Edit Drawing
				</span>
				<DialogCloseButton onClose={onClose} />
			</div>

			{/* Color */}
			<div className="drawing-properties-dialog-section">
				<label className="drawing-properties-dialog-label">
					Color
				</label>
				<div className="drawing-properties-color-grid">
					{colorPresets.map((color) => (
						<button
							key={color}
							onClick={() => onUpdate({ color })}
							className="drawing-properties-color-button"
							data-selected={style.color === color}
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>
			</div>

			{/* Path Mode */}
			<div className="drawing-properties-dialog-section">
				<label className="drawing-properties-dialog-label">
					Path Mode
				</label>
				<div className="drawing-properties-button-group">
					<button
						onClick={() => onUpdate({ pathMode: 'sharp' })}
						className="drawing-properties-option-button"
						data-active={style.pathMode === 'sharp'}
					>
						<svg viewBox='0 0 48 16' className="drawing-properties-path-svg">
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
						className="drawing-properties-option-button"
						data-active={style.pathMode === 'curve'}
					>
						<svg viewBox='0 0 48 16' className="drawing-properties-path-svg">
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
			<div className="drawing-properties-dialog-section">
				<label className="drawing-properties-dialog-label">
					Line Style
				</label>
				<div className="drawing-properties-button-group">
					<button
						onClick={() => onUpdate({ lineStyle: 'solid' })}
						className="drawing-properties-option-button"
						data-active={style.lineStyle === 'solid'}
					>
						<div className="drawing-properties-line-solid" />
					</button>
					<button
						onClick={() => onUpdate({ lineStyle: 'dashed' })}
						className="drawing-properties-option-button"
						data-active={style.lineStyle === 'dashed'}
					>
						<div className="drawing-properties-line-dashed">
							<div className="drawing-properties-line-dashed-segment" />
							<div className="drawing-properties-line-dashed-segment" />
							<div className="drawing-properties-line-dashed-segment" />
						</div>
					</button>
				</div>
			</div>

			{/* Line End */}
			<div className="drawing-properties-dialog-section">
				<label className="drawing-properties-dialog-label">
					Line End
				</label>
				<div className="drawing-properties-button-group-grid">
					<button
						onClick={() => onUpdate({ lineEnd: 'none' })}
						className="drawing-properties-line-end-text"
						data-active={style.lineEnd === 'none'}
					>
						None
					</button>
					<button
						onClick={() => onUpdate({ lineEnd: 'arrow' })}
						className="drawing-properties-line-end-icon"
						data-active={style.lineEnd === 'arrow'}
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
						className="drawing-properties-line-end-icon"
						data-active={style.lineEnd === 'tShape'}
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
			<div className="drawing-properties-dialog-section">
				<label className="drawing-properties-dialog-label">
					Line Thickness
				</label>
				<div className="drawing-properties-button-group-2col">
					{brushSizes.map((brush) => {
						// Convert pixel size to feet for storage
						const strokeWidthInFeet = brush.size / coordSystem.scale

						// Check if current style matches (compare in feet)
						const isSelected = Math.abs(style.strokeWidth - strokeWidthInFeet) < 0.01

						return (
							<button
								key={brush.size}
								onClick={() => onUpdate({ strokeWidth: strokeWidthInFeet })}
								className="drawing-properties-brush-button"
								data-active={isSelected}
							>
								<div className="drawing-properties-brush-content">
									<div
										className="drawing-properties-brush-dot"
										style={{
											width: `${brush.size * 2}px`,
											height: `${brush.size * 2}px`,
										}}
									/>
									<span className="drawing-properties-brush-label">{brush.label}</span>
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
