import { useState } from 'react'
import {
	MousePointer,
	UserPlus,
	Pencil,
	Palette,
	PaintBucket
} from 'lucide-react'
import type { Tool } from '../../types/play.types'
import type { HashAlignment } from '../../types/play.types'
import { HashDialog } from '../toolbar/dialogs/HashDialog'
import { DrawOptionsDialog } from '../toolbar/dialogs/DrawOptionsDialog'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { ToolbarButton } from '../ui/toolbar-button'
import { EraserIcon } from '../toolbar/icons/EraserIcon'
import { HashIcon } from '../toolbar/icons/HashIcon'
import { ColorSwatchIndicator } from '../toolbar/ColorSwatchIndicator'
import { useTheme } from '@/contexts/SettingsContext'
import { usePlayContext } from '../../contexts/PlayContext'
import { areLinemenAtDefaultPositions } from '../../utils/lineman.utils'
import { useDialogAutoClose } from '../../hooks/useDialogAutoClose'
import { cn } from '../ui/utils'

interface ConceptToolbarProps {
	selectedTool: Tool
	onToolChange: (tool: Tool) => void
	color: string
	onColorChange: (color: string) => void
	hashAlignment: HashAlignment
	onHashAlignmentChange: (alignment: HashAlignment) => void
	showColorPicker: boolean
	onShowColorPickerChange: (show: boolean) => void
	showDrawOptions: boolean
	onShowDrawOptionsChange: (show: boolean) => void
	lineStyle: 'solid' | 'dashed'
	lineEnd: 'none' | 'arrow' | 'tShape'
	brushSize: number
	pathMode: 'sharp' | 'curve'
	onLineStyleChange: (style: 'solid' | 'dashed') => void
	onLineEndChange: (end: 'none' | 'arrow' | 'tShape') => void
	onBrushSizeChange: (size: number) => void
	onPathModeChange: (mode: 'sharp' | 'curve') => void
}

// Base styles for custom buttons that don't use ToolbarButton
const baseButtonClass = cn(
	'w-14 h-14 rounded-xl flex items-center justify-center',
	'cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
	'transition-all duration-200'
)

export function ConceptToolbar({
	selectedTool,
	onToolChange,
	color,
	onColorChange,
	hashAlignment,
	onHashAlignmentChange,
	showColorPicker,
	onShowColorPickerChange,
	showDrawOptions,
	onShowDrawOptionsChange,
	lineStyle,
	lineEnd,
	brushSize,
	pathMode,
	onLineStyleChange,
	onLineEndChange,
	onBrushSizeChange,
	onPathModeChange
}: ConceptToolbarProps) {
	const { theme } = useTheme()
	const { state } = usePlayContext()
	const players = state.players || []
	const [showHashDialog, setShowHashDialog] = useState(false)

	// Auto-close DrawOptionsDialog when hovering out
	useDialogAutoClose({
		isOpen: showDrawOptions,
		onClose: () => onShowDrawOptionsChange(false),
		dataAttribute: 'data-draw-dialog',
	})

	return (
		<TooltipProvider>
			<div className="w-20 h-full flex flex-col items-center justify-center bg-card border-r border-border" style={{ gap: '12px' }}>
				{/* Select Tool */}
				<ToolbarButton
					icon={MousePointer}
					tooltip="Select (V)"
					isActive={selectedTool === 'select'}
					onClick={() => onToolChange('select')}
				/>

				{/* Add Player Tool */}
				<ToolbarButton
					icon={UserPlus}
					tooltip="Add Player (P)"
					isActive={selectedTool === 'addPlayer'}
					onClick={() => onToolChange('addPlayer')}
				/>

				{/* Draw Tool with Options Dialog */}
				<div className="relative">
					<ToolbarButton
						icon={Pencil}
						tooltip="Draw (D)"
						isActive={selectedTool === 'draw'}
						onClick={() => {
							if (selectedTool === 'draw') {
								onShowDrawOptionsChange(!showDrawOptions)
							} else {
								onToolChange('draw')
								onShowDrawOptionsChange(true)
							}
						}}
					/>

					{showDrawOptions && selectedTool === 'draw' && (
						<div className="absolute left-full ml-2 top-0 z-50">
							<DrawOptionsDialog
								lineStyle={lineStyle}
								lineEnd={lineEnd}
								brushSize={brushSize}
								pathMode={pathMode}
								onLineStyleChange={onLineStyleChange}
								onLineEndChange={onLineEndChange}
								onBrushSizeChange={onBrushSizeChange}
								onPathModeChange={onPathModeChange}
								onClose={() => onShowDrawOptionsChange(false)}
								useRelativePosition={true}
							/>
						</div>
					)}
				</div>

				{/* Erase Tool - Custom icon (EraserIcon not a Lucide icon) */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => onToolChange('erase')}
							className={cn(
								baseButtonClass,
								selectedTool === 'erase'
									? "bg-action-button text-action-button-foreground shadow-lg"
									: "border border-border hover:bg-accent hover:text-foreground"
							)}
							style={selectedTool !== 'erase' ? { color: 'var(--icon-muted)' } : undefined}
						>
							<EraserIcon />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Erase (E)</TooltipContent>
				</Tooltip>

				{/* Color Tool - Custom with color swatch overlay */}
				<ToolbarButton
					icon={Palette}
					tooltip="Pick Color (C)"
					isActive={showColorPicker}
					onClick={() => onShowColorPickerChange(!showColorPicker)}
					className="relative"
				>
					<ColorSwatchIndicator color={color} />
				</ToolbarButton>

				{/* Fill Tool - Custom icon transform */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => onToolChange('fill')}
							className={cn(
								baseButtonClass,
								"relative",
								selectedTool === 'fill'
									? "bg-action-button text-action-button-foreground shadow-lg"
									: "border border-border hover:bg-accent hover:text-foreground"
							)}
							style={selectedTool !== 'fill' ? { color: 'var(--icon-muted)' } : undefined}
						>
							<PaintBucket className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Fill (F)</TooltipContent>
				</Tooltip>

				{/* Hash Marker Tool - Custom icon */}
				<div className="relative">
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() => setShowHashDialog(!showHashDialog)}
								data-hash-dialog
								className={cn(
									baseButtonClass,
									showHashDialog
										? "bg-action-button text-action-button-foreground shadow-lg"
										: "border border-border hover:bg-accent hover:text-foreground"
								)}
								style={!showHashDialog ? { color: 'var(--icon-muted)' } : undefined}
							>
								<HashIcon />
							</button>
						</TooltipTrigger>
						<TooltipContent side="right">Ball on Hash (H)</TooltipContent>
					</Tooltip>

					{showHashDialog && (
						<div className="absolute left-full ml-2 top-0 z-50">
							<HashDialog
								currentAlignment={hashAlignment}
								linemenAtDefault={areLinemenAtDefaultPositions(players, hashAlignment)}
								onAlignmentChange={alignment => {
									onHashAlignmentChange(alignment)
									setShowHashDialog(false)
								}}
								onClose={() => setShowHashDialog(false)}
								useRelativePosition={true}
							/>
						</div>
					)}
				</div>
			</div>
		</TooltipProvider>
	)
}
