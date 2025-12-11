import { useState, useEffect, useRef } from 'react'
import { X, FlipHorizontal } from 'lucide-react'
import type {
	BaseConcept,
	TargetingMode,
	BallPosition,
	PlayDirection
} from '../../types/concept.types'
import { Canvas } from '../canvas/Canvas'
import { ConceptToolbar } from './ConceptToolbar'
import { TargetingTooltip } from './TargetingTooltip'
import { PlayProvider } from '../../contexts/PlayContext'
import type { Tool } from '../../types/play.types'
import { generateThumbnail } from '../../utils/thumbnail'
import { ColorPickerDialog } from '../toolbar/dialogs/ColorPickerDialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../ui/select'
import { Input } from '../ui/input'

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
	const canvasContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isOpen && concept && mode === 'edit') {
			setName(concept.name)
			setDescription(concept.description ?? '')
			setScope(concept.playbook_id ? 'playbook' : 'team')
			setTargetingMode(concept.targeting_mode)
			setBallPosition(concept.ball_position)
			setPlayDirection(concept.play_direction)
			setNameError('')
			setTouched(false)
		} else if (isOpen && mode === 'create') {
			setName('')
			setDescription('')
			setScope('team')
			setTargetingMode('absolute_role')
			setBallPosition('center')
			setPlayDirection('na')
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
		// TODO: Implement flip logic - mirror all drawings horizontally
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[85vw] h-[85vh] max-w-6xl flex flex-col">
				{/* Name and Scope */}
				<div className="px-6 py-4 flex items-start gap-4">
					<div className="flex-1">
						<label className="block text-sm font-medium mb-1">
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
							<p className="mt-1 text-sm text-red-600 dark:text-red-400">
								{nameError}
							</p>
						)}
						<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
							{name.length}/100 characters
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Scope
						</label>
						<div className="flex gap-2">
							<button
								onClick={() => setScope('team')}
								className={`
									px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
									${scope === 'team'
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
									}
								`}
							>
								Team
							</button>
							<button
								onClick={() => setScope('playbook')}
								disabled={!playbookId}
								className={`
									px-4 py-2 rounded-md text-sm font-medium transition-colors
									${scope === 'playbook'
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
									}
									${!playbookId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
								`}
							>
								Playbook
							</button>
						</div>
					</div>

					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer ml-auto"
						aria-label="Close dialog"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Canvas Area */}
				<div className="flex-1 flex min-h-0 relative">
					{/* Left Toolbar */}
					<ConceptToolbar
						selectedTool={selectedTool}
						onToolChange={setSelectedTool}
						color={color}
						onColorChange={setColor}
						hashAlignment={hashAlignment}
						onHashAlignmentChange={setHashAlignment}
						showColorPicker={showColorPicker}
						onShowColorPickerChange={setShowColorPicker}
					/>

					{/* Canvas */}
					<div ref={canvasContainerRef} className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
						<PlayProvider>
							<Canvas
								drawingState={{
									tool: selectedTool,
									color,
									brushSize: 3,
									lineStyle: 'solid',
									lineEnd: 'arrow',
									pathMode: 'sharp',
									eraseSize: 40,
									snapThreshold: 20
								}}
								hashAlignment={hashAlignment}
								showPlayBar={false}
							containerMode="fill"
								showFieldMarkings={true}
							/>
						</PlayProvider>
					</div>

					{/* Color Picker Dialog */}
					{showColorPicker && (
						<ColorPickerDialog
							currentColor={color}
							onColorChange={setColor}
							onClose={() => setShowColorPicker(false)}
							position={{ left: 'left-28', top: 'top-24' }}
						/>
					)}
				</div>

				{/* Bottom Controls */}
				<div className="px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						{/* Targeting Mode */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
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
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
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
							className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 cursor-pointer"
							title="Flip concept horizontally"
						>
							<FlipHorizontal className="w-4 h-4" />
							Flip
						</button>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2">
						<button
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={!isFormValid || isSaving}
							className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
						>
							{isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
