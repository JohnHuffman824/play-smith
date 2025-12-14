import type { Drawing, PathStyle } from '../../../types/drawing.types'
import type { FieldCoordinateSystem } from '../../../utils/coordinates'
import { DialogCloseButton } from '../../ui/dialog-close-button'
import { BRUSH_SIZES, COLOR_PRESETS } from './dialog.constants'
import {
	BrushSizeSelector,
	LineEndSelector,
	LineStyleSelector,
	PathModeSelector,
} from './shared'
import './drawing-properties-dialog.css'

interface DrawingPropertiesDialogProps {
	drawing: Drawing
	position: { x: number; y: number }
	onUpdate: (_updates: Partial<PathStyle>) => void
	onClose: () => void
	coordSystem: FieldCoordinateSystem
	onAddPreSnapMovement?: () => void
	playerHasPreSnapMovement?: boolean
}

const DIALOG_WIDTH = 440
const DIALOG_MAX_HEIGHT = 360

export function DrawingPropertiesDialog({
	drawing,
	position,
	onUpdate,
	onClose,
	coordSystem,
	onAddPreSnapMovement,
	playerHasPreSnapMovement,
}: DrawingPropertiesDialogProps) {
	const { style } = drawing

	// Show pre-snap movement button only if drawing is linked to a player
	const showPreSnapButton = !!drawing.playerId
	const hasPreSnapMotion = !!drawing.preSnapMotion

	// Position dialog near click, but keep on screen
	// Ensure dialog stays within viewport bounds
	const left = Math.min(
		Math.max(0, position.x),
		window.innerWidth - DIALOG_WIDTH - 16 // 16px margin
	)
	const top = Math.min(
		Math.max(0, position.y),
		window.innerHeight - DIALOG_MAX_HEIGHT - 16 // 16px margin
	)

	const dialogStyle = {
		position: 'fixed' as const,
		left,
		top,
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

				{/* Two-column grid layout */}
				<div className="drawing-properties-grid">
					{/* Row 1: Color + Line Thickness */}
					<div className="drawing-properties-dialog-section">
						<label className="drawing-properties-dialog-label">
							Color
						</label>
						<div className="drawing-properties-color-grid">
							{COLOR_PRESETS.map((preset) => (
								<button
									key={preset.value}
									onClick={() => onUpdate({ color: preset.value })}
									className="drawing-properties-color-button"
									data-selected={style.color === preset.value}
									style={{ backgroundColor: preset.value }}
									title={preset.name}
								/>
							))}
						</div>
					</div>

					<div className="drawing-properties-dialog-section">
						<label className="drawing-properties-dialog-label">
							Line Thickness
						</label>
						<BrushSizeSelector
							brushSize={
								// Find the brush size in pixels that matches the current strokeWidth in feet
								BRUSH_SIZES.find((b) =>
									Math.abs(style.strokeWidth - b.size / coordSystem.scale) < 0.01
								)?.size || BRUSH_SIZES[0].size
							}
							sizes={BRUSH_SIZES}
							onChange={(sizeInPixels) => {
								// Convert pixel size to feet for storage
								const strokeWidthInFeet = sizeInPixels / coordSystem.scale
								onUpdate({ strokeWidth: strokeWidthInFeet })
							}}
						/>
					</div>

					{/* Row 2: Path Mode + Pre-Snap Movement */}
					<div className="drawing-properties-dialog-section">
						<label className="drawing-properties-dialog-label">
							Path Mode
						</label>
						<PathModeSelector
							pathMode={style.pathMode}
							onChange={(mode) => onUpdate({ pathMode: mode })}
						/>
					</div>

					{showPreSnapButton && onAddPreSnapMovement ? (
						<div className="drawing-properties-dialog-section">
							<label className="drawing-properties-dialog-label">
								Pre-Snap Movement
							</label>
							<button
								onClick={() => {
									onAddPreSnapMovement()
									onClose()
								}}
								className="drawing-properties-presnap-button"
								disabled={playerHasPreSnapMovement && !hasPreSnapMotion}
								title={
									playerHasPreSnapMovement && !hasPreSnapMotion
										? 'Player already has pre-snap movement on another drawing'
										: hasPreSnapMotion
											? 'Click to remove pre-snap movement'
											: 'Click to add pre-snap movement'
								}
							>
								{hasPreSnapMotion ? 'Remove' : 'Add'}
							</button>
						</div>
					) : (
						<div className="drawing-properties-dialog-section" />
					)}

					{/* Row 3: Line Style + Line End */}
					<div className="drawing-properties-dialog-section">
						<label className="drawing-properties-dialog-label">
							Line Style
						</label>
						<LineStyleSelector
							lineStyle={style.lineStyle}
							onChange={(lineStyle) => onUpdate({ lineStyle })}
						/>
					</div>

					<div className="drawing-properties-dialog-section">
						<label className="drawing-properties-dialog-label">
							Line End
						</label>
						<LineEndSelector
							lineEnd={style.lineEnd}
							onChange={(lineEnd) => onUpdate({ lineEnd })}
						/>
					</div>
				</div>
			</div>
		</>
	)
}
