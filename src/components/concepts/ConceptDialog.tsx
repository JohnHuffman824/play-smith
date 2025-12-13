import { useState, useEffect, useRef, useCallback } from 'react'
import { X, FlipHorizontal } from 'lucide-react'
import type {
	BaseConcept,
	TargetingMode,
	BallPosition,
	PlayDirection
} from '../../types/concept.types'
import { Canvas } from '../canvas/Canvas'
import { ConceptToolbar } from './ConceptToolbar'
import { FlipController } from './FlipController'
import { TargetingTooltip } from './TargetingTooltip'
import { ConceptTypeTooltip } from './ConceptTypeTooltip'
import { PlayProvider } from '../../contexts/PlayContext'
import { CanvasViewportProvider } from '../../contexts/CanvasViewportContext'
import type { Tool } from '../../types/play.types'
import { generateThumbnail } from '../../utils/thumbnail'
import { ColorPickerDialog } from '../toolbar/dialogs/ColorPickerDialog'
import { DrawOptionsDialog } from '../toolbar/dialogs/DrawOptionsDialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../ui/select'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import './concept-dialog.css'

interface ConceptDialogProps {
	isOpen: boolean
	onClose: () => void
	mode: 'create' | 'edit' | 'save-as'
	concept?: BaseConcept
	teamId: string
	playbookId?: string
	onSave: (concept: Partial<BaseConcept>) => Promise<void>
}

export function ConceptDialog({
	isOpen,
	onClose,
	mode,
	concept,
	teamId,
	playbookId,
	onSave
}: ConceptDialogProps) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [scope, setScope] = useState<'team' | 'playbook'>('team')
	const [targetingMode, setTargetingMode] = useState<TargetingMode>('absolute_role')
	const [ballPosition, setBallPosition] = useState<BallPosition>('center')
	const [playDirection, setPlayDirection] = useState<PlayDirection>('na')
	const [selectedTool, setSelectedTool] = useState<Tool>('select')
	const [color, setColor] = useState('#000000')
	const [hashAlignment, setHashAlignment] = useState<HashAlignment>('middle')
	const [isSaving, setIsSaving] = useState(false)
	const [nameError, setNameError] = useState('')
	const [touched, setTouched] = useState(false)
	const [showColorPicker, setShowColorPicker] = useState(false)
	const [showDrawOptions, setShowDrawOptions] = useState(false)
	const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('solid')
	const [lineEnd, setLineEnd] = useState<'none' | 'arrow' | 'tShape'>('arrow')
	const [brushSize, setBrushSize] = useState(3)
	const [pathMode, setPathMode] = useState<'sharp' | 'curve'>('sharp')
	const [flipCanvas, setFlipCanvas] = useState<(() => void) | null>(null)
	const [isMotion, setIsMotion] = useState(false)
	const [isModifier, setIsModifier] = useState(false)
	const canvasContainerRef = useRef<HTMLDivElement>(null)

	// Memoize the callback to prevent FlipController's useEffect from running on every render
	const handleFlipReady = useCallback((fn: () => void) => {
		setFlipCanvas(() => fn)
	}, [])

	useEffect(() => {
		if (isOpen && concept && mode === 'edit') {
			setName(concept.name)
			setDescription(concept.description ?? '')
			setScope(concept.playbook_id ? 'playbook' : 'team')
			setTargetingMode(concept.targeting_mode)
			setBallPosition(concept.ball_position)
			setPlayDirection(concept.play_direction)
			setIsMotion(concept.is_motion)
			setIsModifier(concept.is_modifier)
			setNameError('')
			setTouched(false)
		} else if (isOpen && mode === 'create') {
			setName('')
			setDescription('')
			setScope('team')
			setTargetingMode('absolute_role')
			setBallPosition('center')
			setPlayDirection('na')
			setIsMotion(false)
			setIsModifier(false)
			setNameError('')
			setTouched(false)
		}
	}, [isOpen, concept, mode])

	// Validate name whenever it changes
	useEffect(() => {
		if (!touched) return

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			setNameError('Concept name is required')
		} else if (trimmedName.length > 100) {
			setNameError('Name must be 100 characters or less')
		} else {
			setNameError('')
		}
	}, [name, touched])

	if (!isOpen) return null

	async function handleSave() {
		const trimmedName = name.trim()

		// Validate before save
		if (!trimmedName) {
			setNameError('Concept name is required')
			setTouched(true)
			return
		}
		if (trimmedName.length > 100) {
			setNameError('Name must be 100 characters or less')
			setTouched(true)
			return
		}

		setIsSaving(true)
		try {
			// Generate thumbnail from canvas
			let thumbnail: string | null = null
			if (canvasContainerRef.current) {
				try {
					thumbnail = await generateThumbnail(canvasContainerRef.current)
				} catch (error) {
					console.warn('Failed to generate thumbnail:', error)
					// Continue without thumbnail
				}
			}

			const conceptData: Partial<BaseConcept> = {
				name: trimmedName,
				description: description.trim() || null,
				thumbnail,
				targeting_mode: targetingMode,
				ball_position: ballPosition,
				play_direction: playDirection,
				is_motion: isMotion,
				is_modifier: isModifier,
				playbook_id: scope === 'playbook' && playbookId ? parseInt(playbookId) : null
			}

			await onSave(conceptData)
			onClose()
		} catch (error) {
			console.error('Failed to save concept:', error)
		} finally {
			setIsSaving(false)
		}
	}

	function handleNameChange(value: string) {
		setName(value)
		if (!touched) {
			setTouched(true)
		}
	}

	const isFormValid = name.trim().length > 0 && name.trim().length <= 100

	function handleFlip() {
		if (flipCanvas) {
			flipCanvas()
		}
	}

	return (
		<div className="concept-dialog-overlay">
			<div className="concept-dialog">
				{/* Name and Scope */}
				<div className="concept-dialog-header">
					<div className="concept-dialog-header-content">
						<label className="concept-dialog-label">
							Concept Name
						</label>
						<Input
							type="text"
							value={name}
							onChange={e => handleNameChange(e.target.value)}
							placeholder="e.g., Mesh, Spacing, Y-Cross"
							maxLength={100}
							className={nameError && touched ? 'border-destructive' : ''}
							aria-invalid={nameError && touched}
						/>
						{nameError && touched && (
							<p className="concept-dialog-error">
								{nameError}
							</p>
						)}
					</div>

					<div>
						<label className="concept-dialog-label">
							Scope
						</label>
						<div className="concept-dialog-scope">
							<button
								onClick={() => setScope('team')}
								className={`concept-dialog-scope-button ${scope === 'team' ? 'concept-dialog-scope-button-active' : 'concept-dialog-scope-button-inactive'}`}
							>
								Team
							</button>
							<button
								onClick={() => setScope('playbook')}
								disabled={!playbookId}
								className={`concept-dialog-scope-button ${scope === 'playbook' ? 'concept-dialog-scope-button-active' : 'concept-dialog-scope-button-inactive'} ${!playbookId ? 'concept-dialog-scope-button-disabled' : ''}`}
							>
								Playbook
							</button>
						</div>
					</div>

					<button
						onClick={onClose}
						className="concept-dialog-close-button"
						aria-label="Close dialog"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Canvas Area */}
				<div className="concept-dialog-canvas-area">
					<PlayProvider>
						{/* Left Toolbar */}
						<ConceptToolbar
							selectedTool={selectedTool}
							onToolChange={tool => {
								setSelectedTool(tool)
								if (tool === 'draw') {
									setShowDrawOptions(true)
								} else {
									setShowDrawOptions(false)
								}
							}}
							color={color}
							onColorChange={setColor}
							hashAlignment={hashAlignment}
							onHashAlignmentChange={setHashAlignment}
							showColorPicker={showColorPicker}
							onShowColorPickerChange={setShowColorPicker}
							showDrawOptions={showDrawOptions}
							onShowDrawOptionsChange={setShowDrawOptions}
							lineStyle={lineStyle}
							lineEnd={lineEnd}
							brushSize={brushSize}
							pathMode={pathMode}
							onLineStyleChange={setLineStyle}
							onLineEndChange={setLineEnd}
							onBrushSizeChange={setBrushSize}
							onPathModeChange={setPathMode}
						/>

						{/* Canvas */}
						<div ref={canvasContainerRef} className="concept-dialog-canvas-container">
							<CanvasViewportProvider>
								<Canvas
									drawingState={{
										tool: selectedTool,
										color,
										brushSize,
										lineStyle,
										lineEnd,
										pathMode,
										eraseSize: 40,
										snapThreshold: 20
									}}
									hashAlignment={hashAlignment}
									showPlayBar={false}
									containerMode="fill"
									showFieldMarkings={true}
								/>
							</CanvasViewportProvider>
						</div>
						<FlipController onFlipReady={handleFlipReady} />
					</PlayProvider>

					{/* Color Picker Dialog */}
					{showColorPicker && (
					<div className="concept-dialog-color-picker">
						<ColorPickerDialog
							currentColor={color}
							onColorChange={setColor}
							onClose={() => setShowColorPicker(false)}
							useRelativePosition={true}
						/>
					</div>
					)}
				</div>

				{/* Bottom Controls */}
				<div className="concept-dialog-footer">
					<div className="concept-dialog-footer-controls">
						{/* Targeting Mode */}
						<div className="concept-dialog-control-group">
							<label className="concept-dialog-control-label">
								Target Type:
							</label>
							<Select
								value={targetingMode}
								onValueChange={v => setTargetingMode(v as TargetingMode)}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="absolute_role">Absolute</SelectItem>
									<SelectItem value="relative_selector">Relative</SelectItem>
								</SelectContent>
							</Select>
							<TargetingTooltip />
						</div>

						{/* Play Direction */}
						<div className="concept-dialog-control-group">
							<label className="concept-dialog-control-label">
								Direction:
							</label>
							<Select
								value={playDirection}
								onValueChange={v => setPlayDirection(v as PlayDirection)}
							>
								<SelectTrigger className="w-[100px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="na">N/A</SelectItem>
									<SelectItem value="left">Left</SelectItem>
									<SelectItem value="right">Right</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Flip Button */}
						<button
							onClick={handleFlip}
							className="concept-dialog-flip-button"
							title="Flip concept horizontally"
						>
							<FlipHorizontal className="w-4 h-4" />
							Flip
						</button>

						{/* Concept Type Flags */}
						<div className="concept-dialog-type-controls">
							<div className="concept-dialog-control-group">
								<label className="concept-dialog-control-label">Type:</label>
								<ConceptTypeTooltip />
							</div>
							<label className="concept-dialog-checkbox-label">
								<Checkbox
									checked={isMotion}
									onCheckedChange={(checked) => {
										setIsMotion(checked === true)
										if (checked) setIsModifier(false)
									}}
								/>
								<span className="concept-dialog-checkbox-text">Motion</span>
							</label>
							<label className="concept-dialog-checkbox-label">
								<Checkbox
									checked={isModifier}
									onCheckedChange={(checked) => {
										setIsModifier(checked === true)
										if (checked) setIsMotion(false)
									}}
								/>
								<span className="concept-dialog-checkbox-text">Modifier</span>
							</label>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="concept-dialog-action-buttons">
						<button
							onClick={onClose}
							className="concept-dialog-cancel-button"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={!isFormValid || isSaving}
							className="concept-dialog-save-button"
						>
							{isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
