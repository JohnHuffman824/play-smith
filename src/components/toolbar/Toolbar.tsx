import {
	MousePointer,
	Minus,
	Paintbrush,
	Palette,
	Plus,
	Trash2,
	ArrowDown,
	Settings,
	Eye,
	EyeOff,
	PaintBucket,
	Pencil,
	Undo2,
	Save,
	Check,
	UserPlus,
	Loader2,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { DrawingState, Tool } from '../../types/play.types'
import type { HashAlignment } from '../../types/field.types'
import { eventBus } from '../../services/EventBus'
import { useDialogAutoClose } from '../../hooks/useDialogAutoClose'
import { ColorPickerDialog } from './dialogs/ColorPickerDialog'
import { DrawOptionsDialog } from './dialogs/DrawOptionsDialog'
import { EraseDialog } from './dialogs/EraseDialog'
import { DrawingDialog } from './dialogs/DrawingDialog'
import { ConfirmDialog } from './dialogs/ConfirmDialog'
import { HashDialog } from './dialogs/HashDialog'
import { SettingsDialog } from './dialogs/SettingsDialog'
import { Tooltip } from './Tooltip'
import { useTheme } from '../../contexts/ThemeContext'
import { EraserIcon } from './icons/EraserIcon'
import { HashIcon } from './icons/HashIcon'
import { ColorSwatchIndicator } from './ColorSwatchIndicator'

interface ToolbarProps {
	drawingState: DrawingState
	setDrawingState: (state: DrawingState) => void
	hashAlignment: HashAlignment
	setHashAlignment: (alignment: HashAlignment) => void
	showPlayBar: boolean
	setShowPlayBar: (show: boolean) => void
	playId?: string
	onDeletePlay?: () => Promise<void>
}

/**
* Primary toolbar for play editor controls and dialogs.
*/
export function Toolbar({
	drawingState,
	setDrawingState,
	hashAlignment,
	setHashAlignment,
	showPlayBar,
	setShowPlayBar,
	playId,
	onDeletePlay,
}: ToolbarProps) {
	const { theme } = useTheme()
	const [showColorPicker, setShowColorPicker] = useState(false)
	const [showDrawOptions, setShowDrawOptions] = useState(false)
	const [showEraseDialog, setShowEraseDialog] = useState(false)
	const [showDrawingDialog, setShowDrawingDialog] = useState(false)
	const [showClearConfirm, setShowClearConfirm] =
		useState(false)
	const [showHashDialog, setShowHashDialog] = useState(false)
	const [showSettingsDialog, setShowSettingsDialog] =
		useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)
	const [columnCount, setColumnCount] = useState(1)
	const [rowsPerColumn, setRowsPerColumn] = useState(13)
	const drawDialogRef = useRef<HTMLDivElement>(null)
	const baseButtonClass = [
		'w-14 h-14 rounded-xl flex items-center justify-center',
		'transition-all cursor-pointer',
	].join(' ')
	const darkNeutralClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600'
	const lightNeutralClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
	const lightToggleClass = 'bg-gray-50 text-gray-600 hover:bg-gray-100'
	const statusDotClass = [
		'absolute -right-1 -top-1 w-3 h-3 bg-green-500',
		'rounded-full border-2 border-white',
	].join(' ')

	function handleSnapThresholdChange(value: number) {
		setDrawingState({ ...drawingState, snapThreshold: value })
	}

	/**
	 * Close all toolbar dialogs except the clear confirmation modal.
	 * Call this before opening any dialog to ensure only one is open at a time.
	 */
	function closeAllDialogs() {
		setShowColorPicker(false)
		setShowDrawOptions(false)
		setShowEraseDialog(false)
		setShowDrawingDialog(false)
		setShowHashDialog(false)
		setShowSettingsDialog(false)
	}

	// Auto-close dialogs when cursor moves away
	useDialogAutoClose({
		isOpen: showDrawOptions,
		onClose: () => setShowDrawOptions(false),
		dataAttribute: 'data-draw-dialog',
	})

	useDialogAutoClose({
		isOpen: showColorPicker,
		onClose: () => setShowColorPicker(false),
		dataAttribute: 'data-color-dialog',
	})

	useDialogAutoClose({
		isOpen: showHashDialog,
		onClose: () => setShowHashDialog(false),
		dataAttribute: 'data-hash-dialog',
	})

	useDialogAutoClose({
		isOpen: showSettingsDialog,
		onClose: () => setShowSettingsDialog(false),
		dataAttribute: 'data-settings-dialog',
	})

	useDialogAutoClose({
		isOpen: showDrawingDialog,
		onClose: () => setShowDrawingDialog(false),
		dataAttribute: 'data-drawing-dialog',
	})

	useDialogAutoClose({
		isOpen: showEraseDialog,
		onClose: () => setShowEraseDialog(false),
		dataAttribute: 'data-erase-dialog',
	})

	// Listen for keyboard shortcut event
	useEffect(() => {
		const handleDrawToolTrigger = () => {
			handleToolChange('draw')
		}

		eventBus.on('dialog:openDraw', handleDrawToolTrigger)
		return () => eventBus.off('dialog:openDraw', handleDrawToolTrigger)
	}, [drawingState.tool])

	// Listen for color picker keyboard shortcut
	useEffect(() => {
		const handleColorPickerTrigger = () => {
			// Close all other dialogs first
			closeAllDialogs()

			// Toggle color picker
			setShowColorPicker(prev => !prev)
		}

		eventBus.on('dialog:openColorPicker', handleColorPickerTrigger)
		return () => eventBus.off('dialog:openColorPicker', handleColorPickerTrigger)
	}, [])

	// Listen for drawing tool keyboard shortcut
	useEffect(() => {
		const handleRouteToolTrigger = () => {
			// Close all other dialogs first
			closeAllDialogs()

			// Toggle drawing dialog
			setShowDrawingDialog(prev => !prev)
		}

		eventBus.on('dialog:openDrawing', handleRouteToolTrigger)
		return () => eventBus.off('dialog:openDrawing', handleRouteToolTrigger)
	}, [])

	// Listen for hash dialog keyboard shortcut
	useEffect(() => {
		const handleHashDialogTrigger = () => {
			// Close all other dialogs first
			closeAllDialogs()

			// Toggle hash dialog
			setShowHashDialog(prev => !prev)
		}

		eventBus.on('dialog:openHash', handleHashDialogTrigger)
		return () => eventBus.off('dialog:openHash', handleHashDialogTrigger)
	}, [])

	// Listen for close all dialogs event
	useEffect(() => {
		const handleCloseAllDialogsEvent = () => {
			closeAllDialogs()
		}

		eventBus.on('dialog:closeAll', handleCloseAllDialogsEvent)
		return () => eventBus.off('dialog:closeAll', handleCloseAllDialogsEvent)
	}, [])

	// Calculate optimal column count and rows based on available height
	useEffect(() => {
		const calculateLayout = () => {
			const BUTTON_SIZE = 56 // 14 * 4 (w-14 h-14 in pixels)
			const GAP = 12
			const PADDING = 12
			const TOTAL_BUTTONS = 13 // Count of all toolbar buttons

			// Use window height as the stable constraint
			const availableHeight = window.innerHeight - (2 * PADDING)

			// Calculate how many buttons fit in one column
			const buttonsPerColumn = Math.floor((availableHeight + GAP) / (BUTTON_SIZE + GAP))

			if (buttonsPerColumn >= TOTAL_BUTTONS) {
				// All buttons fit in one column
				setColumnCount(1)
				setRowsPerColumn(TOTAL_BUTTONS)
				return
			}

			if (buttonsPerColumn <= 0) {
				// Fallback for very small screens
				setColumnCount(1)
				setRowsPerColumn(TOTAL_BUTTONS)
				return
			}

			// Calculate columns needed for even distribution
			const neededColumns = Math.ceil(TOTAL_BUTTONS / buttonsPerColumn)

			// Calculate rows for even distribution
			const rows = Math.ceil(TOTAL_BUTTONS / neededColumns)

			setColumnCount(neededColumns)
			setRowsPerColumn(rows)
		}

		calculateLayout()

		// Recalculate on window resize
		window.addEventListener('resize', calculateLayout)
		return () => window.removeEventListener('resize', calculateLayout)
	}, [])

	function toolButtonClass(isActive: boolean) {
		const activeClass = 'bg-blue-500 text-white shadow-lg scale-105'
		const variant = isActive
			? activeClass
			: theme == 'dark'
				? darkNeutralClass
				: lightNeutralClass
		return `${baseButtonClass} ${variant}`
	}

	function neutralButtonClass(lightVariant: string) {
		return `${baseButtonClass} ${
			theme == 'dark' ? darkNeutralClass : lightVariant
		}`
	}

	function coloredButtonClass(
		lightVariant: string,
		darkVariant: string,
	) {
		return `${baseButtonClass} ${
			theme == 'dark' ? darkVariant : lightVariant
		}`
	}

	function handleToolChange(tool: Tool) {
		// Close all dialogs when switching tools
		closeAllDialogs()

		if (tool == 'color') {
			setShowColorPicker(true)
			return
		}

		if (tool == 'draw') {
			// If already on draw tool, toggle the dialog (for keyboard shortcut support)
			if (drawingState.tool == 'draw') {
				setShowDrawOptions(prev => !prev)
			} else {
				setDrawingState({ ...drawingState, tool })
				setShowDrawOptions(true)
			}
			return
		}

		if (tool == 'drawing') {
			setShowDrawingDialog(true)
			return
		}

		setDrawingState({ ...drawingState, tool })
	}

	function handleAddPlayer() {
		eventBus.emit('player:add', {})
	}

	function handleAddComponent() {
		eventBus.emit('component:add')
	}

	function handleSavePlay() {
		setIsSaving(true)
		eventBus.emit('canvas:save')
	}

	// Listen for save completion
	useEffect(() => {
		const handleSaveComplete = () => {
			setIsSaving(false)
			setShowSuccess(true)
			setTimeout(() => setShowSuccess(false), 2000)
		}

		eventBus.on('canvas:save-complete', handleSaveComplete)
		return () => eventBus.off('canvas:save-complete', handleSaveComplete)
	}, [])

	function handleClearPlay() {
		setShowClearConfirm(true)
	}

	function confirmClearPlay() {
		eventBus.emit('canvas:clear')
		setShowClearConfirm(false)
	}

	return (
		<>
			<div
				className={`h-full border-r ${
					theme == 'dark'
						? 'bg-gray-800 border-gray-700'
						: 'bg-white border-gray-200'
				}`}
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${columnCount}, 56px)`,
					gridTemplateRows: `repeat(${rowsPerColumn}, 56px)`,
					gridAutoFlow: 'column',
					gap: '12px',
					padding: '12px',
					alignContent: 'center',
					justifyContent: 'start',
					minWidth: '80px',
					width: 'auto',
				}}
			>
				{/* Select Tool */}
				<Tooltip content='Select (S)'>
					<button
						onClick={() => handleToolChange('select')}
						className={toolButtonClass(
							drawingState.tool == 'select',
						)}
					>
						<MousePointer size={22} />
					</button>
				</Tooltip>

				{/* Add Player Tool */}
				<Tooltip content='Add Player (A)'>
					<button
						onClick={() => {
							handleToolChange('addPlayer')
							handleAddPlayer()
						}}
						className={toolButtonClass(
							drawingState.tool == 'addPlayer',
						)}
					>
						<UserPlus size={22} />
					</button>
				</Tooltip>

				{/* Draw Tool */}
				<Tooltip content='Draw (D)'>
					<button
						onClick={() => handleToolChange('draw')}
						className={`${
							toolButtonClass(drawingState.tool == 'draw')
						} relative`}
					>
						<Pencil size={22} />
						{drawingState.tool == 'draw' && (
							<div className={statusDotClass} />
						)}
					</button>
				</Tooltip>

				{/* Erase Tool */}
				<Tooltip content='Erase (E)'>
					<button
						onClick={() => {
							// Close all dialogs first
							closeAllDialogs()

							// If already on erase tool, toggle the dialog
							if (drawingState.tool == 'erase') {
								setShowEraseDialog(!showEraseDialog)
							} else {
								// Switch to erase tool and show dialog
								setDrawingState({ ...drawingState, tool: 'erase' })
								setShowEraseDialog(true)
							}
						}}
						className={toolButtonClass(
							drawingState.tool == 'erase',
						)}
					>
						<EraserIcon />
					</button>
				</Tooltip>

				{/* Color Tool */}
				<Tooltip content='Pick Color (C)'>
					<button
						onClick={() => handleToolChange('color')}
						className={`${
							toolButtonClass(showColorPicker)
						} relative`}
					>
						<Palette size={22} />
						<ColorSwatchIndicator color={drawingState.color} />
					</button>
				</Tooltip>

				{/* Fill Color Tool */}
				<Tooltip content='Fill Color (F)'>
					<button
						onClick={() => handleToolChange('fill')}
						className={`${toolButtonClass(drawingState.tool == 'fill')} relative`}
					>
						<PaintBucket size={22} style={{ transform: 'scaleX(-1)' }} />
					</button>
				</Tooltip>

				{/* Undo Button */}
				<Tooltip content='Undo (⌘Z)'>
					<button
						onClick={() => eventBus.emit('canvas:undo')}
						className={neutralButtonClass(lightNeutralClass)}
					>
						<Undo2 size={22} />
					</button>
				</Tooltip>

				{/* Drawing Tool - COMMENTED OUT */}
				{/* <Tooltip content='Add Drawing (R)'>
					<button
						onClick={() => handleToolChange('drawing')}
						className={toolButtonClass(showDrawingDialog)}
					>
						<ArrowDown
							size={24}
							style={{
								transform: 'rotate(-45deg)',
							}}
						/>
					</button>
				</Tooltip> */}

				{/* Hash Marker Tool */}
				<Tooltip content='Ball on Hash (H)'>
					<button
						onClick={() => {
							closeAllDialogs()
							setShowHashDialog(!showHashDialog)
						}}
						className={toolButtonClass(showHashDialog)}
					>
						<HashIcon />
					</button>
				</Tooltip>

				{/* Create Concept Tool */}
				<Tooltip content='Create Concept (G)'>
					<button
						onClick={() => {
							handleToolChange('addComponent')
							handleAddComponent()
						}}
						className={toolButtonClass(
							drawingState.tool == 'addComponent',
						)}
					>
						<Plus size={24} />
					</button>
				</Tooltip>

				{/* Toggle Play Bar Button */}
				<Tooltip
					content={
						showPlayBar ? 'Hide Play Bar' : 'Show Play Bar'
					}
				>
					<button
						onClick={() => setShowPlayBar(!showPlayBar)}
						className={neutralButtonClass(lightToggleClass)}
					>
						{showPlayBar ? (
							<Eye size={22} />
						) : (
							<EyeOff size={22} />
						)}
					</button>
				</Tooltip>

				{/* Settings Button */}
				<Tooltip content='Settings'>
					<button
						onClick={() => {
							closeAllDialogs()
							setShowSettingsDialog(!showSettingsDialog)
						}}
						className={neutralButtonClass(lightToggleClass)}
					>
						<Settings size={22} />
					</button>
				</Tooltip>

				{/* Save Button */}
				<Tooltip content='Save'>
					<button
						onClick={handleSavePlay}
						disabled={isSaving}
						className={`${coloredButtonClass(
							'bg-green-50 text-green-600 hover:bg-green-100',
							'bg-green-900 text-green-400 hover:bg-green-800',
						)} transition-transform duration-200 ease-out ${
							showSuccess ? 'scale-[1.2]' : 'scale-100'
						} ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
					>
						{isSaving ? (
							<Loader2 size={22} className="animate-spin" />
						) : showSuccess ? (
							<Check size={22} />
						) : (
							<Save size={22} />
						)}
					</button>
				</Tooltip>

				{/* Clear Button */}
				<Tooltip content='Clear'>
					<button
						onClick={handleClearPlay}
						className={coloredButtonClass(
							'bg-red-50 text-red-500 hover:bg-red-100',
							'bg-red-900 text-red-400 hover:bg-red-800',
						)}
					>
						<Trash2 size={22} />
					</button>
				</Tooltip>
			</div>

			{/* Dialogs */}
			{showColorPicker && (
				<ColorPickerDialog
					currentColor={drawingState.color}
					onColorChange={(color) =>
						setDrawingState({ ...drawingState, color })
					}
					onClose={() => setShowColorPicker(false)}
				/>
			)}

			{showDrawOptions && drawingState.tool == 'draw' && (
				<DrawOptionsDialog
					lineStyle={drawingState.lineStyle}
					lineEnd={drawingState.lineEnd}
					brushSize={drawingState.brushSize}
					pathMode={drawingState.pathMode}
					onLineStyleChange={(lineStyle) =>
						setDrawingState({ ...drawingState, lineStyle })
					}
					onLineEndChange={(lineEnd) =>
						setDrawingState({ ...drawingState, lineEnd })
					}
					onBrushSizeChange={(brushSize) =>
						setDrawingState({ ...drawingState, brushSize })
					}
					onPathModeChange={(pathMode) =>
						setDrawingState({ ...drawingState, pathMode })
					}
					onClose={() => setShowDrawOptions(false)}
				/>
			)}

			{showEraseDialog && (
				<EraseDialog
					eraseSize={drawingState.eraseSize}
					onEraseSizeChange={(eraseSize) => {
						setDrawingState({ ...drawingState, tool: 'erase', eraseSize })
					}}
					onClose={() => setShowEraseDialog(false)}
				/>
			)}

			{showDrawingDialog && (
				<DrawingDialog
					onClose={() => setShowDrawingDialog(false)}
				/>
			)}

			{showClearConfirm && (
				<ConfirmDialog
					title='Clear Play?'
					message={
						'Are you sure you want to clear the current play? ' +
						'This action cannot be undone.'
					}
					confirmLabel='Clear'
					cancelLabel='Cancel'
					onConfirm={confirmClearPlay}
					onCancel={() => setShowClearConfirm(false)}
					variant='danger'
				/>
			)}

			{showHashDialog && (
				<HashDialog
					currentAlignment={hashAlignment}
					onAlignmentChange={setHashAlignment}
					onClose={() => setShowHashDialog(false)}
				/>
			)}

			{showSettingsDialog && (
				<SettingsDialog
					snapThreshold={drawingState.snapThreshold}
					onSnapThresholdChange={handleSnapThresholdChange}
					onClose={() => setShowSettingsDialog(false)}
				/>
			)}
		</>
	)
}