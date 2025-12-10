import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Toolbar } from '../components/toolbar/Toolbar'
import { Canvas } from '../components/canvas/Canvas'
import { PlayHeader } from '../components/plays/PlayHeader'
import { PlayCardsSection } from '../components/plays/PlayCardsSection'
import { AddConceptSubDialog } from '../components/concepts/AddConceptSubDialog'
import { ConceptDialog } from '../components/concepts/ConceptDialog'
import { SelectionOverlay } from '../components/canvas/SelectionOverlay'
import { useTheme } from '../contexts/ThemeContext'
import { PlayProvider, usePlayContext } from '../contexts/PlayContext'
import { ConceptProvider, useConcept } from '../contexts/ConceptContext'
import { useConceptData } from '../hooks/useConceptData'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { eventBus } from '../services/EventBus'

function PlayEditorContent() {
	const { theme } = useTheme()
	const { teamId, playbookId } = useParams<{ teamId: string; playbookId?: string }>()
	const navigate = useNavigate()

	const {
		state: playState,
		setDrawingState,
		setHashAlignment,
		setShowPlayBar,
		applyFormation,
		applyConcept,
		applyConceptGroup
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

	const [showAddConceptDialog, setShowAddConceptDialog] = useState(false)
	const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([])

	// Set up keyboard shortcuts
	useKeyboardShortcuts({ setDrawingState })

	// Listen for component:add event from toolbar
	useEffect(() => {
		function handleAddComponent() {
			setShowAddConceptDialog(true)
		}

		eventBus.on('component:add', handleAddComponent)
		return () => eventBus.off('component:add', handleAddComponent)
	}, [])

	// Apply selected concepts to canvas
	useEffect(() => {
		conceptState.appliedConcepts.forEach(chip => {
			if (chip.type === 'formation' && chip.entity) {
				applyFormation(chip.entity as any)
			} else if (chip.type === 'concept' && chip.entity) {
				applyConcept(chip.entity as any)
			} else if (chip.type === 'concept_group' && chip.entity) {
				applyConceptGroup(chip.entity as any)
			}
		})
	}, [conceptState.appliedConcepts])

	function handleBackToPlaybook() {
		if (playbookId) {
			navigate(`/playbooks/${playbookId}`)
		} else if (teamId) {
			navigate(`/teams/${teamId}/playbooks`)
		}
	}

	function handleSelectFormation(formation: any) {
		applyFormation(formation)
		setShowAddConceptDialog(false)
	}

	function handleSelectConcept(concept: any) {
		applyConcept(concept)
		setShowAddConceptDialog(false)
	}

	function handleSelectGroup(group: any) {
		applyConceptGroup(group)
		setShowAddConceptDialog(false)
	}

	function handleCreateNewConcept() {
		openConceptDialog()
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
		// TODO: Delete selected objects
		setSelectedObjectIds([])
	}

	function handleDuplicateSelection() {
		// TODO: Duplicate selected objects
	}

	if (!teamId) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-red-500">Team ID is required</p>
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

			{/* Add Concept Dialog */}
			<AddConceptSubDialog
				isOpen={showAddConceptDialog}
				onClose={() => setShowAddConceptDialog(false)}
				formations={formations}
				concepts={concepts}
				conceptGroups={conceptGroups}
				onSelectFormation={handleSelectFormation}
				onSelectConcept={handleSelectConcept}
				onSelectGroup={handleSelectGroup}
				onCreateNew={handleCreateNewConcept}
			/>

			{/* Concept Dialog */}
			<ConceptDialog
				isOpen={conceptState.isConceptDialogOpen}
				onClose={closeConceptDialog}
				mode={conceptState.editingConceptId ? 'edit' : 'create'}
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
