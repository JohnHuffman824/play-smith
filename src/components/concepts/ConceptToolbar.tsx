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
import { Tooltip } from '../toolbar/Tooltip'
import { ToolButton } from '../toolbar/ToolButton'
import { EraserIcon } from '../toolbar/icons/EraserIcon'
import { HashIcon } from '../toolbar/icons/HashIcon'
import { ColorSwatchIndicator } from '../toolbar/ColorSwatchIndicator'
import { useTheme } from '../../contexts/ThemeContext'
import { usePlayContext } from '../../contexts/PlayContext'
import { areLinemenAtDefaultPositions } from '../../utils/lineman.utils'
import { useDialogAutoClose } from '../../hooks/useDialogAutoClose'

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

const TOOLS = [
	{ id: 'select' as Tool, icon: MousePointer, label: 'Select (V)' },
	{ id: 'addPlayer' as Tool, icon: UserPlus, label: 'Add Player (P)' }
]

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
		<div className="w-20 h-full flex flex-col items-center justify-center bg-card border-r border-border" style={{ gap: '12px' }}>
			{/* Tools */}
			{TOOLS.map(tool => {
				const Icon = tool.icon
				return (
					<ToolButton
						key={tool.id}
						icon={<Icon size={22} />}
						label={tool.label}
						isSelected={selectedTool === tool.id}
						onClick={() => onToolChange(tool.id)}
					/>
				)
			})}

			{/* Draw Tool with Options Dialog */}
			<div className="relative">
				<ToolButton
					icon={<Pencil size={22} />}
					label="Draw (D)"
					isSelected={selectedTool === 'draw'}
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

			{/* Erase Tool */}
			<ToolButton
				icon={<EraserIcon />}
				label="Erase (E)"
				isSelected={selectedTool === 'erase'}
				onClick={() => onToolChange('erase')}
			/>

			{/* Color Selector */}
			<Tooltip content="Pick Color (C)">
				<button
					onClick={() => onShowColorPickerChange(!showColorPicker)}
					className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
						showColorPicker
							? 'bg-blue-500 text-white shadow-lg scale-105'
							: 'bg-secondary text-secondary-foreground hover:bg-accent'
					}`}
					aria-label="Color picker"
				>
					<Palette size={22} />
					<ColorSwatchIndicator color={color} />
				</button>
			</Tooltip>

			{/* Fill Tool */}
			<ToolButton
				icon={<PaintBucket size={22} style={{ transform: 'scaleX(-1)' }} />}
				label="Fill (F)"
				isSelected={selectedTool === 'fill'}
				onClick={() => onToolChange('fill')}
			/>

			{/* Ball on Hash Button */}
			<div className="relative">
				<ToolButton
					icon={<HashIcon />}
					label="Ball on Hash (H)"
					onClick={() => setShowHashDialog(!showHashDialog)}
					dataAttribute="data-hash-dialog"
				/>

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
	)
}
