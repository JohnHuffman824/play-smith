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
}

const TOOLS = [
	{ id: 'select' as Tool, icon: MousePointer, label: 'Select (V)' },
	{ id: 'add-player' as Tool, icon: UserPlus, label: 'Add Player (P)' },
	{ id: 'draw' as Tool, icon: Pencil, label: 'Draw (D)' }
]

const PRESET_COLORS = [
	'#000000', // Black
	'#EF4444', // Red
	'#3B82F6', // Blue
	'#10B981', // Green
	'#F59E0B', // Orange
	'#8B5CF6', // Purple
	'#EC4899', // Pink
	'#6B7280'  // Gray
]

export function ConceptToolbar({
	selectedTool,
	onToolChange,
	color,
	onColorChange,
	hashAlignment,
	onHashAlignmentChange
}: ConceptToolbarProps) {
	const [showHashDialog, setShowHashDialog] = useState(false)

	return (
		<div className="w-20 h-full flex flex-col items-center py-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ gap: '12px' }}>
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
			<div className="relative group">
				<Tooltip content="Color">
					<button
						className="w-14 h-14 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer relative"
						aria-label="Color picker"
					>
						<Palette size={22} className="text-gray-700 dark:text-gray-300" />
						<ColorSwatchIndicator color={color} />
					</button>
				</Tooltip>

				{/* Color Palette Dropdown */}
				<div className="absolute left-full ml-2 top-0 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50">
					<div className="grid grid-cols-4 gap-1">
						{PRESET_COLORS.map(presetColor => (
							<button
								key={presetColor}
								onClick={() => onColorChange(presetColor)}
								className={`
									w-8 h-8 rounded border-2 transition-all
									${color === presetColor
										? 'border-blue-500 scale-110'
										: 'border-gray-300 dark:border-gray-600 hover:scale-105'
									}
								`}
								style={{ backgroundColor: presetColor }}
								aria-label={`Color ${presetColor}`}
							/>
						))}
					</div>

					<div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
						<label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
							Custom:
							<input
								type="color"
								value={color}
								onChange={e => onColorChange(e.target.value)}
								className="w-8 h-6 rounded cursor-pointer"
							/>
						</label>
					</div>
				</div>
			</div>

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
