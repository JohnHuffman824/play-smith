import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '../components/toolbar/Toolbar'
import { Canvas } from '../components/canvas/Canvas'
import { PlayHeader } from '../components/plays/PlayHeader'
import { PlayCardsSection } from '../components/plays/PlayCardsSection'
import { ConceptDialog } from '../components/concepts/ConceptDialog'
import { SelectionOverlay } from '../components/canvas/SelectionOverlay'
import { useTheme } from '../contexts/ThemeContext'
import { PlayProvider, usePlayContext } from '../contexts/PlayContext'
import { ConceptProvider, useConcept } from '../contexts/ConceptContext'
import { useConceptData } from '../hooks/useConceptData'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { eventBus } from '../services/EventBus'
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

			console.log('Saving play with players:', playState.players)

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
					console.log('Play saved successfully')
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
	}, [playId, playState.players, playState.drawings, playState.play, playState.hashAlignment])

	// Load play data on mount - also sets teamId for concept data
	useEffect(() => {
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

				console.log('Loading play - players from API:', play.players)

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
					console.log('Setting players:', play.players)
					setPlayers(play.players)
				} else {
					console.log('No players to load')
				}
				if (play.drawings?.length > 0) {
					dispatch({ type: 'SET_DRAWINGS', drawings: play.drawings })
				}

				console.log('Play loaded successfully')
			} catch (error) {
				console.error('Load error:', error)
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

	// Listen for delete selection event
	useEffect(() => {
		function handleDeleteSelection() {
			// Delete all selected objects
			for (const id of selectedObjectIds) {
				// Try to delete as drawing first
				deleteDrawing(id)
				// Also dispatch player deletion
				dispatch({ type: 'DELETE_PLAYER', id })
			}
			setSelectedObjectIds([])
		}

		eventBus.on('selection:delete', handleDeleteSelection)
		return () => eventBus.off('selection:delete', handleDeleteSelection)
	}, [selectedObjectIds, deleteDrawing, dispatch])

	function handleBackToPlaybook() {
		if (playbookId) {
			navigate(`/playbooks/${playbookId}`)
		} else if (teamId) {
			navigate(`/teams/${teamId}/playbooks`)
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

	function handleDeleteSelection() {
		for (const id of selectedObjectIds) {
			deleteDrawing(id)
			dispatch({ type: 'DELETE_PLAYER', id })
		}
		setSelectedObjectIds([])
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
				<Canvas
					drawingState={playState.drawingState}
					hashAlignment={playState.hashAlignment}
					showPlayBar={playState.showPlayBar}
					onSelectionChange={setSelectedObjectIds}
				/>
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
