import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '../components/toolbar/Toolbar'
import { Canvas } from '../components/canvas/Canvas'
import { PlayHeader } from '../components/plays/PlayHeader'
import { PlayCardsSection } from '../components/plays/PlayCardsSection'
import { ConceptDialog } from '../components/concepts/ConceptDialog'
import { SelectionOverlay } from '../components/canvas/SelectionOverlay'
import { SelectedTagsOverlay } from '../components/tags/SelectedTagsOverlay'
import { TagDialog } from '../components/tags/TagDialog'
import { useTheme } from '@/contexts/SettingsContext'
import { PlayProvider, usePlayContext } from '../contexts/PlayContext'
import { ConceptProvider, useConcept } from '../contexts/ConceptContext'
import { CanvasViewportProvider } from '../contexts/CanvasViewportContext'
import { useConceptData } from '../hooks/useConceptData'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTagsData, type Tag } from '../hooks/useTagsData'
import type { Play } from '../hooks/usePlaybookData'
import { eventBus } from '../services/EventBus'
import { createDefaultLinemen } from '../utils/lineman.utils'
import { Modal } from '../components/shared/Modal'
import { Input } from '../components/ui/input'
import { ConfirmDialog } from '../components/toolbar/dialogs/ConfirmDialog'
import {
	CHIP_TYPE_FORMATION,
	CHIP_TYPE_CONCEPT,
	CHIP_TYPE_CONCEPT_GROUP,
	DIALOG_MODE_CREATE,
	DIALOG_MODE_EDIT
} from '../constants/concept.constants'

const SAVE_DELAY_MS = 100
const DEFAULT_PLAY_NAME = 'New Play'

interface ApiPlay {
	id: number
	name: string
	section_id: number | null
	formation_id: number | null
	personnel_id: number | null
	play_type: string
	defensive_formation_id: number | null
	tags: Array<string | { name: string; color: string }>
	updated_at: string
	drawings: unknown[]
	players: unknown[]
}

function PlayEditorContent() {
	const { theme } = useTheme()
	const { playbookId, playId } = useParams<{
		playbookId?: string
		playId?: string
	}>()
	const [teamId, setTeamId] = useState<string | null>(null)
	const navigate = useNavigate()

	const {
		state: playState,
		setDrawingState,
		setHashAlignment,
		setShowPlayBar,
		setPlayers,
		applyFormation,
		applyConcept,
		applyConceptGroup,
		deleteDrawing,
		dispatch,
		markClean
	} = usePlayContext()

	const {
		state: conceptState,
		openConceptDialog,
		closeConceptDialog
	} = useConcept()

	const {
		formations,
		concepts,
		conceptGroups,
		createConcept,
		updateConcept,
		isLoading: conceptsLoading
	} = useConceptData(teamId, playbookId)

	const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([])

	const { tags: availableTags, createTag } = useTagsData(teamId)
	const [selectedTags, setSelectedTags] = useState<Tag[]>([])
	const [showTagDialog, setShowTagDialog] = useState(false)
	const [isPlayLoaded, setIsPlayLoaded] = useState(false)
	const [playbookPlays, setPlaybookPlays] = useState<Play[]>([])
	const [isAddingPlay, setIsAddingPlay] = useState(false)
	const [showRenameModal, setShowRenameModal] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [modalTargetPlayId, setModalTargetPlayId] = useState<string | null>(null)
	const [targetPlayName, setTargetPlayName] = useState('')
	const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
	const [initialPlayState, setInitialPlayState] = useState<{
		players: any[]
		drawings: any[]
	} | null>(null)

	/**
	 * Unified delete method for removing selected objects.
	 * Used by both keyboard shortcuts and SelectionOverlay delete button.
	 *
	 * Deletes all objects (drawings and players) with matching IDs.
	 */
	const deleteSelectedObjects = useCallback((objectIds: string[]) => {
		// Delete all selected objects
		for (const id of objectIds) {
			// Try to delete as drawing first
			deleteDrawing(id)
			// Also dispatch player deletion
			dispatch({ type: 'DELETE_PLAYER', id })
		}
		// Clear selection after deletion
		setSelectedObjectIds([])
	}, [deleteDrawing, dispatch])

	// Set up keyboard shortcuts
	useKeyboardShortcuts({ setDrawingState })

	// Listen for component:add event from toolbar
	useEffect(() => {
		function handleAddComponent() {
			openConceptDialog()
		}

		eventBus.on('component:add', handleAddComponent)
		return () => eventBus.off('component:add', handleAddComponent)
	}, [openConceptDialog])

	// Listen for save event from toolbar
	useEffect(() => {
		async function handleSave() {
			if (!playId) {
				console.error('No play ID - cannot save')
				eventBus.emit('canvas:save-complete', { success: false, error: 'No play ID' })
				return
			}

			try {
				const response = await fetch(`/api/plays/${playId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: playState.play || 'Untitled Play',
						custom_players: playState.players,
						custom_drawings: playState.drawings,
						hash_position: playState.hashAlignment,
					}),
				})

				if (!response.ok) {
					const errorData = await response.json()
					console.error('Save failed:', errorData)
					eventBus.emit('canvas:save-complete', {
						success: false,
						error: errorData.error || 'Failed to save play'
					})
				} else {
					// Save tags
					await fetch(`/api/plays/${playId}/tags`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ tag_ids: selectedTags.map(t => t.id) })
					})

					// Mark as clean after successful save
					markClean()

					eventBus.emit('canvas:save-complete', { success: true })
				}
			} catch (error) {
				console.error('Save error:', error)
				eventBus.emit('canvas:save-complete', {
					success: false,
					error: error instanceof Error ? error.message : 'Failed to save play'
				})
			}
		}

		eventBus.on('canvas:save', handleSave)
		return () => eventBus.off('canvas:save', handleSave)
	}, [playId, playState.players, playState.drawings, playState.play, playState.hashAlignment, selectedTags, markClean])

	// Load play data on mount - also sets teamId for concept data
	useEffect(() => {
		// Reset loading state when playId changes
		setIsPlayLoaded(false)

		async function loadPlay() {
			if (!playId) return

			// CLEAR STATE BEFORE LOADING NEW PLAY
			dispatch({ type: 'SET_DRAWINGS', drawings: [] })
			setPlayers([])

			try {
				const response = await fetch(`/api/plays/${playId}`)
				if (!response.ok) {
					console.error('Failed to load play')
					setIsPlayLoaded(true)
					return
				}

				const data = await response.json()
				const play = data.play

				// Set teamId from play response (via playbook join)
				if (play.teamId) {
					setTeamId(play.teamId)
				}

				if (play.name) {
					dispatch({ type: 'SET_PLAY', play: play.name })
				}
				if (play.hashAlignment) {
					dispatch({ type: 'SET_HASH_ALIGNMENT', alignment: play.hashAlignment })
				}

				// Set players (or default linemen for empty plays)
				if (play.players?.length > 0) {
					setPlayers(play.players)
				} else {
					const hashAlignment = play.hashAlignment || 'middle'
					const defaultLinemen = createDefaultLinemen(hashAlignment)
					setPlayers(defaultLinemen)
				}

				// Set drawings (already cleared above, so this handles all cases)
				if (play.drawings?.length > 0) {
					dispatch({ type: 'SET_DRAWINGS', drawings: play.drawings })
				}

				// Load tags
				const tagsRes = await fetch(`/api/plays/${playId}/tags`)
				if (tagsRes.ok) {
					const tagsData = await tagsRes.json()
					setSelectedTags(tagsData.tags || [])
				}

				// Mark play as loaded after all data is fetched
				setIsPlayLoaded(true)

				// Mark as clean after loading play data
				markClean()
			} catch (error) {
				console.error('Load error:', error)
				setIsPlayLoaded(true)
			}
		}

		loadPlay()
	}, [playId, markClean]) // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch all plays in the playbook for the play bar
	useEffect(() => {
		async function fetchPlaybookPlays() {
			if (!playbookId) return

			try {
				const response = await fetch(`/api/playbooks/${playbookId}/plays`)
				if (!response.ok) return

				const data = await response.json()
				const plays = (data.plays || []).map((apiPlay: ApiPlay): Play => ({
					id: String(apiPlay.id),
					name: apiPlay.name || '',
					section_id: apiPlay.section_id
						? String(apiPlay.section_id)
						: null,
					formation: apiPlay.formation_id
						? String(apiPlay.formation_id)
						: '',
					personnel: apiPlay.personnel_id
						? String(apiPlay.personnel_id)
						: undefined,
					playType: apiPlay.play_type || '',
					defensiveFormation: apiPlay.defensive_formation_id
						? String(apiPlay.defensive_formation_id)
						: '',
					tags: (apiPlay.tags || []).map((t) =>
						typeof t === 'string' ? t : t.name
					),
					tagObjects: apiPlay.tags || [],
					lastModified: apiPlay.updated_at
						? new Date(apiPlay.updated_at).toLocaleDateString()
						: new Date().toLocaleDateString(),
					drawings: apiPlay.drawings || [],
					players: apiPlay.players || []
				}))
				setPlaybookPlays(plays)
			} catch (error) {
				console.error('Failed to fetch playbook plays:', error)
			}
		}

		fetchPlaybookPlays()
	}, [playbookId])

	// Apply selected concepts to canvas
	useEffect(() => {
		conceptState.appliedConcepts.forEach(chip => {
			if (chip.type === CHIP_TYPE_FORMATION && chip.entity) {
				applyFormation(chip.entity as any)
			} else if (chip.type === CHIP_TYPE_CONCEPT && chip.entity) {
				applyConcept(chip.entity as any)
			} else if (chip.type === CHIP_TYPE_CONCEPT_GROUP && chip.entity) {
				applyConceptGroup(chip.entity as any)
			}
		})
	}, [conceptState.appliedConcepts])

	// Listen for delete selection event (Delete/Backspace keyboard shortcut)
	useEffect(() => {
		function handleDeleteSelection() {
			deleteSelectedObjects(selectedObjectIds)
		}

		eventBus.on('selection:delete', handleDeleteSelection)
		return () => eventBus.off('selection:delete', handleDeleteSelection)
	}, [selectedObjectIds, deleteSelectedObjects])

	// Listen for tags:openDialog event from toolbar
	useEffect(() => {
		function handleOpenTagDialog() {
			setShowTagDialog(true)
		}

		eventBus.on('tags:openDialog', handleOpenTagDialog)
		return () => eventBus.off('tags:openDialog', handleOpenTagDialog)
	}, [])

	function handleBackToPlaybook() {
		if (playState.isDirty) {
			setShowUnsavedChangesDialog(true)
			return
		}

		navigateBackToPlaybook()
	}

	function navigateBackToPlaybook() {
		if (playbookId) {
			navigate(`/playbooks/${playbookId}`)
		} else if (teamId) {
			navigate(`/teams/${teamId}/playbooks`)
		}
	}

	function handleRemoveTag(tagId: number) {
		setSelectedTags(prev => prev.filter(t => t.id !== tagId))
	}

	async function handleAddPlay() {
		if (!playbookId || isAddingPlay) return

		setIsAddingPlay(true)

		try {
			// Save current play first
			eventBus.emit('canvas:save')

			// Wait a moment for save to complete
			await new Promise(resolve =>
				setTimeout(resolve, SAVE_DELAY_MS)
			)

			// Create new play
			const response = await fetch(
				`/api/playbooks/${playbookId}/plays`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: DEFAULT_PLAY_NAME })
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				console.error('Failed to create play:', errorData)
				setIsAddingPlay(false)
				return
			}

			const data = await response.json()
			const newPlayId = data.play?.id

			if (!newPlayId) {
				console.error('No play ID in response')
				setIsAddingPlay(false)
				return
			}

			// Note: isAddingPlay will reset on unmount/navigation
			navigate(`/playbooks/${playbookId}/play/${newPlayId}`)
		} catch (error) {
			console.error('Failed to create play:', error)
			setIsAddingPlay(false)
		}
	}

	function handleRenamePlay(playId: string) {
		const play = playbookPlays.find((p) => p.id === playId)
		if (!play) return

		setModalTargetPlayId(playId)
		setTargetPlayName(play.name)
		setShowRenameModal(true)
	}

	async function confirmRename() {
		if (!modalTargetPlayId || !targetPlayName.trim()) return

		try {
			const response = await fetch(`/api/plays/${modalTargetPlayId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: targetPlayName.trim() })
			})

			if (!response.ok) {
				console.error('Failed to rename play')
				return
			}

			// Update local state
			setPlaybookPlays((prev) =>
				prev.map((p) =>
					p.id === modalTargetPlayId
						? { ...p, name: targetPlayName.trim() }
						: p
				)
			)

			setShowRenameModal(false)
			setModalTargetPlayId(null)
			setTargetPlayName('')
		} catch (error) {
			console.error('Failed to rename play:', error)
		}
	}

	function handleDeletePlayFromBar(playId: string) {
		setModalTargetPlayId(playId)
		setShowDeleteModal(true)
	}

	async function confirmDeleteFromBar() {
		if (!modalTargetPlayId) return

		try {
			const response = await fetch(`/api/plays/${modalTargetPlayId}`, {
				method: 'DELETE',
				credentials: 'include'
			})

			if (!response.ok) {
				console.error('Failed to delete play')
				return
			}

			// Update local state
			setPlaybookPlays((prev) =>
				prev.filter((p) => p.id !== modalTargetPlayId)
			)

			setShowDeleteModal(false)
			setModalTargetPlayId(null)
		} catch (error) {
			console.error('Failed to delete play:', error)
		}
	}

	async function handleDuplicatePlay(playId: string) {
		try {
			const response = await fetch(`/api/plays/${playId}/duplicate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			})

			if (!response.ok) {
				console.error('Failed to duplicate play')
				return
			}

			const data = await response.json()
			const newPlay = data.play

			// Add duplicated play to local state (right after original)
			setPlaybookPlays((prev) => {
				const index = prev.findIndex((p) => p.id === playId)
				const playToInsert: Play = {
					id: String(newPlay.id),
					name: newPlay.name || '',
					section_id: newPlay.section_id
						? String(newPlay.section_id)
						: null,
					formation: newPlay.formation_id
						? String(newPlay.formation_id)
						: '',
					personnel: newPlay.personnel_id
						? String(newPlay.personnel_id)
						: undefined,
					playType: newPlay.play_type || '',
					defensiveFormation: newPlay.defensive_formation_id
						? String(newPlay.defensive_formation_id)
						: '',
					tags: [],
					tagObjects: [],
					lastModified: new Date().toLocaleDateString(),
					drawings: newPlay.custom_drawings || [],
					players: newPlay.custom_players || []
				}
				const newPlays = [...prev]
				newPlays.splice(index + 1, 0, playToInsert)
				return newPlays
			})
		} catch (error) {
			console.error('Failed to duplicate play:', error)
		}
	}

	async function handleDeletePlay() {
		if (!playId) return

		const response = await fetch(`/api/plays/${playId}`, {
			method: 'DELETE',
			credentials: 'include'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error ?? 'Failed to delete play')
		}

		// Navigate back to playbook after deletion
		if (playbookId) {
			navigate(`/playbooks/${playbookId}`)
		} else {
			navigate('/playbooks')
		}
	}

	async function handleSaveConcept(conceptData: any) {
		if (conceptState.editingConceptId) {
			await updateConcept(conceptState.editingConceptId, conceptData)
		} else {
			await createConcept({
				...conceptData,
				assignments: []
			})
		}
	}

	function handleSaveSelectionAsConcept() {
		// TODO: Gather selected objects and open ConceptDialog with preSelectedObjects
		openConceptDialog()
	}

	/**
	 * Handler for SelectionOverlay delete button
	 * Calls the unified deleteSelectedObjects method
	 */
	function handleDeleteSelection() {
		deleteSelectedObjects(selectedObjectIds)
	}

	function handleDuplicateSelection() {
		// TODO: Duplicate selected objects
	}

	if (!playbookId || !playId) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-red-500">
					Playbook ID and Play ID are required
				</p>
			</div>
		)
	}

	// Show loading screen until play data is fully loaded
	// Concepts can load in the background after the canvas appears
	if (!isPlayLoaded) {
		return (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
					<p className="text-foreground">
						Loading play...
					</p>
				</div>
			</div>
		)
	}

	return (
		<main className="flex h-screen bg-background">
			<Toolbar
				drawingState={playState.drawingState}
				setDrawingState={setDrawingState}
				hashAlignment={playState.hashAlignment}
				setHashAlignment={setHashAlignment}
				showPlayBar={playState.showPlayBar}
				setShowPlayBar={setShowPlayBar}
				playId={playId}
				onDeletePlay={handleDeletePlay}
			/>
			<div className='flex-1 flex flex-col relative'>
				<PlayHeader
					teamId={teamId}
					playbookId={playbookId}
					onBackToPlaybook={handleBackToPlaybook}
				/>
				<div className="relative flex-1">
					<CanvasViewportProvider>
						<Canvas
							drawingState={playState.drawingState}
							hashAlignment={playState.hashAlignment}
							showPlayBar={playState.showPlayBar}
							playId={playId}
							onSelectionChange={setSelectedObjectIds}
						/>
					</CanvasViewportProvider>
					{/* Selected Tags Overlay */}
					<SelectedTagsOverlay
						tags={selectedTags}
						onRemoveTag={handleRemoveTag}
					/>
				</div>
				<PlayCardsSection
					plays={playbookPlays}
					currentPlayId={playId}
					showPlayBar={playState.showPlayBar}
					onOpenPlay={(targetPlayId) => navigate(`/playbooks/${playbookId}/play/${targetPlayId}`)}
					onAddPlay={handleAddPlay}
					isAddingPlay={isAddingPlay}
				onRenamePlay={handleRenamePlay}
				onDeletePlay={handleDeletePlayFromBar}
				onDuplicatePlay={handleDuplicatePlay}
				/>

				{/* Selection Overlay */}
				<SelectionOverlay
					selectedCount={selectedObjectIds.length}
					onSaveAsConcept={handleSaveSelectionAsConcept}
					onDelete={handleDeleteSelection}
					onDuplicate={handleDuplicateSelection}
				/>
			</div>


			{/* Rename Play Modal */}
		<Modal
			isOpen={showRenameModal}
			onClose={() => {
				setShowRenameModal(false)
				setTargetPlayId(null)
				setTargetPlayName('')
			}}
			title="Rename Play"
		>
			<div className="space-y-4">
				<div>
					<label className="block mb-2">Play Name</label>
					<Input
						type="text"
						value={targetPlayName}
						onChange={(e) => setTargetPlayName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								confirmRename()
							}
						}}
						placeholder="Enter play name..."
						autoFocus
					/>
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<button
						onClick={() => {
							setShowRenameModal(false)
							setTargetPlayId(null)
							setTargetPlayName('')
						}}
						className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						Cancel
					</button>
					<button
						onClick={confirmRename}
						disabled={!targetPlayName.trim()}
						className="px-4 py-2 bg-action-button text-action-button-foreground hover:bg-action-button/90 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						Rename
					</button>
				</div>
			</div>
		</Modal>

		{/* Delete Play Confirmation Modal */}
		<Modal
			isOpen={showDeleteModal}
			onClose={() => {
				setShowDeleteModal(false)
				setTargetPlayId(null)
			}}
			title="Delete Play"
		>
			<div className="space-y-4">
				<p>
					Are you sure you want to delete this play?
					This action cannot be undone.
				</p>
				<div className="flex justify-end gap-2 pt-2">
					<button
						onClick={() => {
							setShowDeleteModal(false)
							setTargetPlayId(null)
						}}
						className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						Cancel
					</button>
					<button
						onClick={confirmDeleteFromBar}
						className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						Delete
					</button>
				</div>
			</div>
		</Modal>

		{/* Unsaved Changes Dialog */}
		{showUnsavedChangesDialog && (
			<ConfirmDialog
				title="Unsaved Changes"
				message="You have unsaved changes. Would you like to save before leaving?"
				confirmLabel="Leave Without Saving"
				cancelLabel="Cancel"
				variant="danger"
				actionLabel="Save & Leave"
				actionVariant="primary"
				onConfirm={() => {
					setShowUnsavedChangesDialog(false)
					navigateBackToPlaybook()
				}}
				onAction={() => {
					eventBus.emit('canvas:save')
					setShowUnsavedChangesDialog(false)
					// Navigate after a brief delay to allow save to complete
					setTimeout(() => {
						navigateBackToPlaybook()
					}, SAVE_DELAY_MS)
				}}
				onCancel={() => setShowUnsavedChangesDialog(false)}
			/>
		)}

		{/* Tag Dialog */}
			<TagDialog
				isOpen={showTagDialog}
				onClose={() => setShowTagDialog(false)}
				availableTags={availableTags}
				selectedTagIds={selectedTags.map(t => t.id)}
				onTagsChange={ids => setSelectedTags(availableTags.filter(t => ids.includes(t.id)))}
				onCreateTag={createTag}
			/>


			{/* Concept Dialog */}
			<ConceptDialog
				isOpen={conceptState.isConceptDialogOpen}
				onClose={closeConceptDialog}
				mode={conceptState.editingConceptId ? DIALOG_MODE_EDIT : DIALOG_MODE_CREATE}
				concept={
					conceptState.editingConceptId
						? concepts.find(c => c.id === conceptState.editingConceptId)
						: undefined
				}
				teamId={teamId}
				playbookId={playbookId}
				onSave={handleSaveConcept}
			/>
		</main>
	)
}

export function PlayEditorPage() {
	return (
		<ConceptProvider>
			<PlayProvider>
				<PlayEditorContent />
			</PlayProvider>
		</ConceptProvider>
	)
}
