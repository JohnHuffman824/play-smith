import { MousePointer, UserPlus, Pencil, Eraser, Palette, PaintBucket } from 'lucide-react'
import type { Tool } from '../../types/play.types'

interface ConceptToolbarProps {
	selectedTool: Tool
	onToolChange: (tool: Tool) => void
	color: string
	onColorChange: (color: string) => void
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
	onColorChange
}: ConceptToolbarProps) {
	return (
		<div className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-600">
			{/* Tools */}
			{TOOLS.map(tool => {
				const Icon = tool.icon
				const isSelected = selectedTool === tool.id
				return (
					<button
						key={tool.id}
						onClick={() => onToolChange(tool.id)}
						className={`
							p-2 rounded transition-colors
							${isSelected
								? 'bg-blue-500 text-white'
								: 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
							}
						`}
						title={tool.label}
						aria-label={tool.label}
					>
						<Icon className="w-5 h-5" />
					</button>
				)
			})}

			<div className="h-px bg-gray-300 dark:bg-gray-600 my-2" />

			{/* Color Selector */}
			<div className="relative group">
				<button
					className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					title="Color"
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
			<button
				onClick={() => onToolChange('fill')}
				className={`
					p-2 rounded transition-colors
					${selectedTool === 'fill'
						? 'bg-blue-500 text-white'
						: 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
					}
				`}
				title="Fill (F)"
				aria-label="Fill tool"
			>
				<PaintBucket className="w-5 h-5" />
			</button>
		</div>
	)
}
