import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '../components/toolbar/Toolbar'
import { Canvas } from '../components/canvas/Canvas'
import { PlayHeader } from '../components/plays/PlayHeader'
import { PlayCardsSection } from '../components/plays/PlayCardsSection'
import { ConceptDialog } from '../components/concepts/ConceptDialog'
import { SelectionOverlay } from '../components/canvas/SelectionOverlay'
import { SelectedTagsOverlay } from '../components/tags/SelectedTagsOverlay'
import { TagDialog } from '../components/tags/TagDialog'
import { useTheme } from '../contexts/ThemeContext'
import { PlayProvider, usePlayContext } from '../contexts/PlayContext'
import { ConceptProvider, useConcept } from '../contexts/ConceptContext'
import { useConceptData } from '../hooks/useConceptData'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTagsData, type Tag } from '../hooks/useTagsData'
import { eventBus } from '../services/EventBus'
import { createDefaultLinemen } from '../utils/lineman.utils'
import {
	CHIP_TYPE_FORMATION,
	CHIP_TYPE_CONCEPT,
	CHIP_TYPE_CONCEPT_GROUP,
	DIALOG_MODE_CREATE,
	DIALOG_MODE_EDIT
} from '../constants/concept.constants'

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
		dispatch
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
	}, [playId, playState.players, playState.drawings, playState.play, playState.hashAlignment, selectedTags])

	// Load play data on mount - also sets teamId for concept data
	useEffect(() => {
		// Reset loading state when playId changes
		setIsPlayLoaded(false)

		async function loadPlay() {
			if (!playId) return

			try {
				const response = await fetch(`/api/plays/${playId}`)
				if (!response.ok) {
					console.error('Failed to load play')
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
				if (play.players?.length > 0) {
					setPlayers(play.players)
				} else {
					// Initialize default linemen for new (empty) plays
					const hashAlignment = play.hashAlignment || 'middle'
					const defaultLinemen = createDefaultLinemen(hashAlignment)
					setPlayers(defaultLinemen)
				}
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
			} catch (error) {
				console.error('Load error:', error)
				// Still mark as loaded even on error to avoid infinite loading
				setIsPlayLoaded(true)
			}
		}

		loadPlay()
	}, [playId, dispatch, setPlayers])

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
		if (playbookId) {
			navigate(`/playbooks/${playbookId}`)
		} else if (teamId) {
			navigate(`/teams/${teamId}/playbooks`)
		}
	}

	function handleRemoveTag(tagId: number) {
		setSelectedTags(prev => prev.filter(t => t.id !== tagId))
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
	// Only wait for concepts if we have a teamId (concepts need teamId to load)
	if (!isPlayLoaded || (teamId && conceptsLoading)) {
		return (
			<div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
					<p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
						Loading play...
					</p>
				</div>
			</div>
		)
	}

	return (
		<main className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
					<Canvas
						drawingState={playState.drawingState}
						hashAlignment={playState.hashAlignment}
						showPlayBar={playState.showPlayBar}
						onSelectionChange={setSelectedObjectIds}
					/>
					{/* Selected Tags Overlay */}
					<SelectedTagsOverlay
						tags={selectedTags}
						onRemoveTag={handleRemoveTag}
					/>
				</div>
				<PlayCardsSection
					playCards={playState.playCards}
					onAddCard={() => {}}
					onDeleteCard={() => {}}
					showPlayBar={playState.showPlayBar}
				/>

				{/* Selection Overlay */}
				<SelectionOverlay
					selectedCount={selectedObjectIds.length}
					onSaveAsConcept={handleSaveSelectionAsConcept}
					onDelete={handleDeleteSelection}
					onDuplicate={handleDuplicateSelection}
				/>
			</div>


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
