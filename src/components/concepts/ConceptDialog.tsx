import { useState, useEffect } from 'react'
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
	const [isSaving, setIsSaving] = useState(false)
	const [nameError, setNameError] = useState('')
	const [touched, setTouched] = useState(false)

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
			const conceptData: Partial<BaseConcept> = {
				name: trimmedName,
				description: description.trim() || null,
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
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 dark:border-gray-600">
					<h2 className="text-xl font-semibold">
						{mode === 'create' && 'Create New Concept'}
						{mode === 'edit' && 'Edit Concept'}
						{mode === 'save-as' && 'Save Selection as Concept'}
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
						aria-label="Close dialog"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Name and Scope */}
				<div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600 flex items-center gap-4">
					<div className="flex-1">
						<label className="block text-sm font-medium mb-1">
							Concept Name
						</label>
						<input
							type="text"
							value={name}
							onChange={e => handleNameChange(e.target.value)}
							placeholder="e.g., Mesh, Spacing, Y-Cross"
							maxLength={100}
							className={`
								w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900
								focus:ring-2 focus:ring-blue-500
								${nameError && touched
									? 'border-red-500 dark:border-red-500'
									: 'border-gray-300 dark:border-gray-600'
								}
							`}
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
									px-4 py-2 rounded-md text-sm font-medium transition-colors
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
									${!playbookId ? 'opacity-50 cursor-not-allowed' : ''}
								`}
							>
								Playbook
							</button>
						</div>
					</div>
				</div>

				{/* Canvas Area */}
				<div className="flex-1 flex min-h-0">
					{/* Left Toolbar */}
					<ConceptToolbar
						selectedTool={selectedTool}
						onToolChange={setSelectedTool}
						color={color}
						onColorChange={setColor}
					/>

					{/* Canvas */}
					<div className="flex-1 overflow-hidden">
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
								hashAlignment="center"
								showPlayBar={false}
								width="100%"
								height="100%"
								showFieldMarkings={true}
							/>
						</PlayProvider>
					</div>
				</div>

				{/* Bottom Controls */}
				<div className="px-6 py-4 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
					<div className="flex items-center gap-4">
						{/* Targeting Mode */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
								Targeting:
							</label>
							<select
								value={targetingMode}
								onChange={e => setTargetingMode(e.target.value as TargetingMode)}
								className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
							>
								<option value="absolute_role">Absolute Role</option>
								<option value="relative_selector">Relative Selector</option>
							</select>
							<TargetingTooltip />
						</div>

						{/* Ball Position */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
								Ball:
							</label>
							<select
								value={ballPosition}
								onChange={e => setBallPosition(e.target.value as BallPosition)}
								className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
							>
								<option value="left">Left Hash</option>
								<option value="center">Center</option>
								<option value="right">Right Hash</option>
							</select>
						</div>

						{/* Play Direction */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium">
								Direction:
							</label>
							<select
								value={playDirection}
								onChange={e => setPlayDirection(e.target.value as PlayDirection)}
								className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
							>
								<option value="na">N/A</option>
								<option value="left">Left</option>
								<option value="right">Right</option>
							</select>
						</div>

						{/* Flip Button */}
						<button
							onClick={handleFlip}
							className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
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
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={!isFormValid || isSaving}
							className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
