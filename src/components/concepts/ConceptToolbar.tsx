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
import { Tooltip } from '../toolbar/Tooltip'
import { ToolButton } from '../toolbar/ToolButton'
import { EraserIcon } from '../toolbar/icons/EraserIcon'
import { HashIcon } from '../toolbar/icons/HashIcon'
import { ColorSwatchIndicator } from '../toolbar/ColorSwatchIndicator'
import { useTheme } from '../../contexts/ThemeContext'

interface ConceptToolbarProps {
	selectedTool: Tool
	onToolChange: (tool: Tool) => void
	color: string
	onColorChange: (color: string) => void
	hashAlignment: HashAlignment
	onHashAlignmentChange: (alignment: HashAlignment) => void
	showColorPicker: boolean
	onShowColorPickerChange: (show: boolean) => void
}

const TOOLS = [
	{ id: 'select' as Tool, icon: MousePointer, label: 'Select (V)' },
	{ id: 'add-player' as Tool, icon: UserPlus, label: 'Add Player (P)' },
	{ id: 'draw' as Tool, icon: Pencil, label: 'Draw (D)' }
]

export function ConceptToolbar({
	selectedTool,
	onToolChange,
	color,
	onColorChange,
	hashAlignment,
	onHashAlignmentChange,
	showColorPicker,
	onShowColorPickerChange
}: ConceptToolbarProps) {
	const { theme } = useTheme()
	const [showHashDialog, setShowHashDialog] = useState(false)

	return (
		<div className="w-20 h-full flex flex-col items-center justify-start py-6 bg-white dark:bg-gray-800" style={{ gap: '12px' }}>
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
							: theme === 'dark'
								? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
								: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
					<HashDialog
						isOpen={showHashDialog}
						onClose={() => setShowHashDialog(false)}
						hashAlignment={hashAlignment}
						onHashAlignmentChange={alignment => {
							onHashAlignmentChange(alignment)
							setShowHashDialog(false)
						}}
					/>
				)}
			</div>
		</div>
	)
}
