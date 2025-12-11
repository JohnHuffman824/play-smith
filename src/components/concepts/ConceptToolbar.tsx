import { useState } from 'react'
import {
	MousePointer,
	UserPlus,
	Pencil,
	Eraser,
	Palette,
	PaintBucket
} from 'lucide-react'
import type { Tool } from '../../types/play.types'
import type { HashAlignment } from '../../types/play.types'
import { HashDialog } from '../toolbar/dialogs/HashDialog'
import { Tooltip } from '../toolbar/Tooltip'

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
	{ id: 'draw' as Tool, icon: Pencil, label: 'Draw (D)' },
	{ id: 'erase' as Tool, icon: Eraser, label: 'Erase (E)' }
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
		<div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-600" style={{ gap: '12px' }}>
			{/* Tools */}
			{TOOLS.map(tool => {
				const Icon = tool.icon
				const isSelected = selectedTool === tool.id
				return (
					<Tooltip key={tool.id} content={tool.label}>
						<button
							onClick={() => onToolChange(tool.id)}
							className={`
								p-2 rounded-xl transition-all
								${isSelected
									? 'bg-blue-500 text-white shadow-lg scale-105'
									: 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
								}
							`}
							aria-label={tool.label}
						>
							<Icon className="w-5 h-5" />
						</button>
					</Tooltip>
				)
			})}

			<div className="h-px bg-gray-300 dark:bg-gray-600 my-2" />

			{/* Color Selector */}
			<div className="relative group">
				<Tooltip content="Color">
					<button
						className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
						aria-label="Color picker"
					>
						<div className="relative">
							<Palette className="w-5 h-5 text-gray-700 dark:text-gray-300" />
							<div
								className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"
								style={{ backgroundColor: color }}
							/>
						</div>
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
			<Tooltip content="Fill (F)">
				<button
					onClick={() => onToolChange('fill')}
					className={`
						p-2 rounded-xl transition-all
						${selectedTool === 'fill'
							? 'bg-blue-500 text-white shadow-lg scale-105'
							: 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
						}
					`}
					aria-label="Fill tool"
				>
					<PaintBucket className="w-5 h-5" />
				</button>
			</Tooltip>

			<div className="h-px bg-gray-300 dark:bg-gray-600 my-2" />

			{/* Ball on Hash Button */}
			<div className="relative">
				<Tooltip content="Ball on Hash (H)">
					<button
						onClick={() => setShowHashDialog(!showHashDialog)}
						className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
						aria-label="Ball on Hash"
						data-hash-dialog
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							className="text-gray-700 dark:text-gray-300"
						>
							<line x1="4" y1="8" x2="20" y2="8" strokeDasharray="2 2" />
							<line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
							<line x1="4" y1="16" x2="20" y2="16" strokeDasharray="2 2" />
						</svg>
					</button>
				</Tooltip>

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
