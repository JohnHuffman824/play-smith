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
import svgPaths from '../../imports/eraser-icon.svg'

interface ToolbarProps {
	drawingState: DrawingState
	setDrawingState: (state: DrawingState) => void
	hashAlignment: HashAlignment
	setHashAlignment: (alignment: HashAlignment) => void
	showPlayBar: boolean
	setShowPlayBar: (show: boolean) => void
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
	const paletteSwatchClass = [
		'absolute -right-1 -bottom-1 w-4 h-4 rounded-full',
		'border-2 shadow-sm',
	].join(' ')

	function handleSnapThresholdChange(value: number) {
		setDrawingState({ ...drawingState, snapThreshold: value })
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
			setShowDrawOptions(false)
			setShowDrawingDialog(false)
			setShowHashDialog(false)
			
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
		setShowColorPicker(false)
		setShowDrawOptions(false)
		setShowHashDialog(false)
			
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
			setShowColorPicker(false)
			setShowDrawOptions(false)
			setShowDrawingDialog(false)
			
			// Toggle hash dialog
			setShowHashDialog(prev => !prev)
		}

		eventBus.on('dialog:openHash', handleHashDialogTrigger)
		return () => eventBus.off('dialog:openHash', handleHashDialogTrigger)
	}, [])

	// Listen for close all dialogs event
	useEffect(() => {
		const handleCloseAllDialogs = () => {
			setShowColorPicker(false)
			setShowDrawOptions(false)
			setShowDrawingDialog(false)
			setShowHashDialog(false)
		}

		eventBus.on('dialog:closeAll', handleCloseAllDialogs)
		return () => eventBus.off('dialog:closeAll', handleCloseAllDialogs)
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
		setShowColorPicker(false)
		setShowDrawOptions(false)
		setShowDrawingDialog(false)

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
		eventBus.emit('canvas:save')
	}

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
				className={`w-20 h-full border-r flex flex-col items-center py-6 ${
					theme == 'dark'
						? 'bg-gray-800 border-gray-700'
						: 'bg-white border-gray-200'
				}`}
				style={{ gap: '12px' }}
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
						<svg
							width='22'
							height='22'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							{/* Head */}
							<circle cx='12' cy='5' r='3' />
							{/* Body */}
							<line x1='12' y1='8' x2='12' y2='17' />
							{/* Arms */}
							<line x1='12' y1='11' x2='6' y2='14' />
							<line x1='12' y1='11' x2='18' y2='14' />
							{/* Legs */}
							<line x1='12' y1='17' x2='7' y2='22' />
							<line x1='12' y1='17' x2='17' y2='22' />
						</svg>
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
						<svg
							width='22'
							height='22'
							viewBox='0 0 235 235'
							fill='none'
							stroke='currentColor'
							strokeWidth='21.3333'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path
								clipRule='evenodd'
								d={svgPaths.p28898e00}
								fillRule='evenodd'
							/>
							<path d={svgPaths.p3a238100} />
						</svg>
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
						<div
							className={`${paletteSwatchClass} ${
								theme == 'dark'
									? 'border-gray-800'
									: 'border-white'
							}`}
							style={{ backgroundColor: drawingState.color }}
						/>
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
						onClick={() => setShowHashDialog(!showHashDialog)}
						className={toolButtonClass(showHashDialog)}
					>
						<svg
							width='22'
							height='22'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							{/* Three solid horizontal lines stacked vertically */}
							<line x1='4' y1='7' x2='20' y2='7' />
							<line x1='4' y1='12' x2='20' y2='12' />
							<line x1='4' y1='17' x2='20' y2='17' />
						</svg>
					</button>
				</Tooltip>

				{/* Add Concept Tool */}
				<Tooltip content='Add Concept (G)'>
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
						onClick={() =>
							setShowSettingsDialog(!showSettingsDialog)
						}
						className={neutralButtonClass(lightToggleClass)}
					>
						<Settings size={22} />
					</button>
				</Tooltip>

				{/* Save Button */}
				<Tooltip content='Save'>
					<button
						onClick={handleSavePlay}
						className={coloredButtonClass(
							'bg-green-50 text-green-600 hover:bg-green-100',
							'bg-green-900 text-green-400 hover:bg-green-800',
						)}
					>
						<ArrowDown size={22} />
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
					onLineStyleChange={(lineStyle) =>
						setDrawingState({ ...drawingState, lineStyle })
					}
					onLineEndChange={(lineEnd) =>
						setDrawingState({ ...drawingState, lineEnd })
					}
					onBrushSizeChange={(brushSize) =>
						setDrawingState({ ...drawingState, brushSize })
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