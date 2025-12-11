import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
	const [searchParams] = useSearchParams()
	const teamId = searchParams.get('teamId')
	const navigate = useNavigate()

	const {
		state: playState,
		setDrawingState,
		setHashAlignment,
		setShowPlayBar,
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
		function handleSave() {
			// TODO: Implement actual save to API when ready
			// For now, just emit save-complete immediately

			// Simulate async save operation
			setTimeout(() => {
				eventBus.emit('canvas:save-complete')
			}, 500)
		}

		eventBus.on('canvas:save', handleSave)
		return () => eventBus.off('canvas:save', handleSave)
	}, [])

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
