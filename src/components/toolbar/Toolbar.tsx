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
	X,
	UserPlus,
	Loader2,
	RotateCcw,
	Tag,
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
import { UnifiedSettingsDialog } from '../shared/UnifiedSettingsDialog'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { ToolbarButton } from '../ui/toolbar-button'
import { useTheme } from '@/contexts/SettingsContext'
import { EraserIcon } from './icons/EraserIcon'
import { HashIcon } from './icons/HashIcon'
import { ColorSwatchIndicator } from './ColorSwatchIndicator'
import { usePlayContext } from '../../contexts/PlayContext'
import { areLinemenAtDefaultPositions } from '../../utils/lineman.utils'
import { cn } from '../ui/utils'

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
	const { state } = usePlayContext()
	const players = state.players || []
	const [showColorPicker, setShowColorPicker] = useState(false)
	const [showDrawOptions, setShowDrawOptions] = useState(false)
	const [showEraseDialog, setShowEraseDialog] = useState(false)
	const [showDrawingDialog, setShowDrawingDialog] = useState(false)
	const [showClearConfirm, setShowClearConfirm] =
		useState(false)
	const [showDeletePlayConfirm, setShowDeletePlayConfirm] =
		useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showHashDialog, setShowHashDialog] = useState(false)
	const [showSettingsDialog, setShowSettingsDialog] =
		useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)
	const [showError, setShowError] = useState(false)
	const [columnCount, setColumnCount] = useState(1)
	const [rowsPerColumn, setRowsPerColumn] = useState(14)
	const drawDialogRef = useRef<HTMLDivElement>(null)

	// Base styles for special buttons (Save, Delete) that don't use ToolbarButton
	const baseButtonClass = cn(
		'w-14 h-14 rounded-xl flex items-center justify-center',
		'cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
		'transition-all duration-200'
	)
	const statusDotClass = 'absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'

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
			const TOTAL_BUTTONS = 16 // Count of all toolbar buttons

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

	function handleToggleTags() {
		closeAllDialogs()
		eventBus.emit('tags:openDialog')
	}

	function handleSavePlay() {
		setIsSaving(true)
		eventBus.emit('canvas:save')
	}

	// Listen for save completion
	useEffect(() => {
		const handleSaveComplete = (result: { success: boolean; error?: string }) => {
			setIsSaving(false)

			if (result.success) {
				setShowSuccess(true)
				setTimeout(() => setShowSuccess(false), 2000)
			} else {
				setShowError(true)
				setTimeout(() => setShowError(false), 2000)
				if (result.error) {
					console.error('Save failed:', result.error)
				}
			}
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

	function handleDeletePlay() {
		setShowDeletePlayConfirm(true)
	}

	async function confirmDeletePlay() {
		if (!onDeletePlay) return

		setIsDeleting(true)
		try {
			await onDeletePlay()
		} catch (error) {
			console.error('Failed to delete play:', error)
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete play'
			)
		} finally {
			setIsDeleting(false)
			setShowDeletePlayConfirm(false)
		}
	}

	return (
		<TooltipProvider>
			<div
				className="h-full border-r bg-card border-border"
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
				<ToolbarButton
					icon={MousePointer}
					tooltip='Select (S)'
					isActive={drawingState.tool == 'select'}
					onClick={() => handleToolChange('select')}
				/>

				{/* Add Player Tool */}
				<ToolbarButton
					icon={UserPlus}
					tooltip='Add Player (A)'
					isActive={drawingState.tool == 'addPlayer'}
					onClick={() => {
						handleToolChange('addPlayer')
						handleAddPlayer()
					}}
				/>

				{/* Draw Tool - Custom due to status dot */}
				<ToolbarButton
					icon={Pencil}
					tooltip='Draw (D)'
					isActive={drawingState.tool == 'draw'}
					onClick={() => handleToolChange('draw')}
					className={drawingState.tool == 'draw' ? 'relative' : ''}
				>
					{drawingState.tool == 'draw' && (
						<div className={statusDotClass} />
					)}
				</ToolbarButton>

				{/* Erase Tool - Custom icon (EraserIcon not a Lucide icon) */}
				{/* Note: Keeping as custom button since EraserIcon is not a LucideIcon */}
				<Tooltip>
					<TooltipTrigger asChild>
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
							className={cn(
								baseButtonClass,
								drawingState.tool == 'erase'
									? "bg-action-button text-action-button-foreground shadow-lg"
									: "border border-border hover:bg-accent hover:text-foreground"
							)}
							style={drawingState.tool !== 'erase' ? { color: 'var(--icon-muted)' } : undefined}
						>
							<EraserIcon />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Erase (E)</TooltipContent>
				</Tooltip>

				{/* Color Tool - Custom with color swatch overlay */}
				<ToolbarButton
					icon={Palette}
					tooltip='Pick Color (C)'
					isActive={showColorPicker}
					onClick={() => handleToolChange('color')}
					className="relative"
				>
					<ColorSwatchIndicator color={drawingState.color} />
				</ToolbarButton>

				{/* Fill Color Tool */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => handleToolChange('fill')}
							className={cn(
								baseButtonClass,
								"relative",
								drawingState.tool == 'fill'
									? "bg-action-button text-action-button-foreground shadow-lg"
									: "border border-border hover:bg-accent hover:text-foreground"
							)}
							style={drawingState.tool !== 'fill' ? { color: 'var(--icon-muted)' } : undefined}
						>
							<PaintBucket className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Fill Color (F)</TooltipContent>
				</Tooltip>

				{/* Undo Button */}
				<ToolbarButton
					icon={Undo2}
					tooltip='Undo (⌘Z)'
					onClick={() => eventBus.emit('canvas:undo')}
				/>

				{/* Drawing Tool - Custom icon transform */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => handleToolChange('drawing')}
							className={cn(
								baseButtonClass,
								showDrawingDialog
									? "bg-action-button text-action-button-foreground shadow-lg"
									: "border border-border hover:bg-accent hover:text-foreground"
							)}
							style={!showDrawingDialog ? { color: 'var(--icon-muted)' } : undefined}
						>
							<ArrowDown
								className="w-6 h-6"
								style={{ transform: 'rotate(-45deg)' }}
							/>
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Add Drawing (R)</TooltipContent>
				</Tooltip>

				{/* Hash Marker Tool - Custom icon (HashIcon not a Lucide icon) */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => {
								closeAllDialogs()
								setShowHashDialog(!showHashDialog)
							}}
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

				{/* Create Concept Tool */}
				<ToolbarButton
					icon={Plus}
					tooltip='Create Concept (G)'
					isActive={drawingState.tool == 'addComponent'}
					onClick={() => {
						handleToolChange('addComponent')
						handleAddComponent()
					}}
				/>

				{/* Tags Button */}
				<ToolbarButton
					icon={Tag}
					tooltip='Tags (T)'
					onClick={handleToggleTags}
				/>

				{/* Toggle Play Bar Button */}
				<ToolbarButton
					icon={showPlayBar ? Eye : EyeOff}
					tooltip={showPlayBar ? 'Hide Play Bar' : 'Show Play Bar'}
					onClick={() => setShowPlayBar(!showPlayBar)}
				/>

				{/* Settings Button */}
				<ToolbarButton
					icon={Settings}
					tooltip='Settings'
					onClick={() => {
						closeAllDialogs()
						setShowSettingsDialog(!showSettingsDialog)
					}}
				/>

				{/* Clear Canvas Button */}
				<ToolbarButton
					icon={RotateCcw}
					tooltip='Clear Canvas'
					onClick={handleClearPlay}
				/>

				{/* Save Button - Custom with success/error states */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleSavePlay}
							disabled={isSaving}
							className={cn(
								baseButtonClass,
								"transition-transform duration-200 ease-out",
								// Color states
								theme == 'dark'
									? "bg-green-900 text-green-400 hover:bg-green-800"
									: showSuccess
									? "bg-green-50 text-green-600 hover:bg-green-100"
									: showError
									? "bg-red-50 text-red-600 hover:bg-red-100"
									: "bg-green-50 text-green-600 hover:bg-green-100",
								// Scale animation
								showSuccess || showError ? "scale-[1.2]" : "scale-100",
								// Disabled state
								isSaving && "opacity-70 cursor-not-allowed"
							)}
						>
							{isSaving ? (
								<Loader2 className="w-6 h-6 animate-spin" />
							) : showSuccess ? (
								<Check className="w-6 h-6" />
							) : showError ? (
								<X className="w-6 h-6" />
							) : (
								<Save className="w-6 h-6" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Save</TooltipContent>
				</Tooltip>

				{/* Delete Play Button - Custom with destructive colors */}
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleDeletePlay}
							disabled={!playId || isDeleting}
							className={cn(
								baseButtonClass,
								theme == 'dark'
									? "bg-red-900 text-red-400 hover:bg-red-800"
									: "bg-red-50 text-red-500 hover:bg-red-100",
								(!playId || isDeleting) && "opacity-50 cursor-not-allowed"
							)}
						>
							{isDeleting ? (
								<Loader2 className="w-6 h-6 animate-spin" />
							) : (
								<Trash2 className="w-6 h-6" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Delete Play</TooltipContent>
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

			{showDeletePlayConfirm && (
				<ConfirmDialog
					title='Delete Play?'
					message={
						'Are you sure you want to permanently delete ' +
						'this play? This action cannot be undone.'
					}
					confirmLabel='Delete'
					cancelLabel='Cancel'
					onConfirm={confirmDeletePlay}
					onCancel={() => setShowDeletePlayConfirm(false)}
					variant='danger'
				/>
			)}

			{showHashDialog && (
				<HashDialog
					currentAlignment={hashAlignment}
					linemenAtDefault={areLinemenAtDefaultPositions(players, hashAlignment)}
					onAlignmentChange={setHashAlignment}
					onClose={() => setShowHashDialog(false)}
				/>
			)}

			<UnifiedSettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				context="play-editor"
			/>
		</TooltipProvider>
	)
}