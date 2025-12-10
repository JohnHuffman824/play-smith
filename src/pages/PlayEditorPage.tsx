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
import {
	CHIP_TYPE_FORMATION,
	CHIP_TYPE_CONCEPT,
	CHIP_TYPE_CONCEPT_GROUP,
	DIALOG_MODE_CREATE,
	DIALOG_MODE_EDIT
} from '../constants/concept.constants'

function PlayEditorContent() {
	const { theme } = useTheme()
	const { playId, playbookId } = useParams<{ playId: string; playbookId: string }>()
	const navigate = useNavigate()
	const [teamId, setTeamId] = useState<string | undefined>(undefined)
	const [isLoadingPlaybook, setIsLoadingPlaybook] = useState(true)
	const [playbookError, setPlaybookError] = useState<string | null>(null)

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

	// Fetch playbook data to determine team_id
	useEffect(() => {
		if (!playbookId) return

		async function fetchPlaybookData() {
			try {
				setIsLoadingPlaybook(true)
				const response = await fetch(`/api/playbooks/${playbookId}`)

				if (response.status === 401) {
					navigate('/login')
					return
				}

				if (!response.ok) {
					throw new Error('Failed to fetch playbook')
				}

				const data = await response.json()
				// team_id can be null for personal playbooks
				setTeamId(data.playbook.team_id?.toString() || undefined)
			} catch (err) {
				setPlaybookError(err instanceof Error ? err.message : 'Failed to load playbook')
			} finally {
				setIsLoadingPlaybook(false)
			}
		}

		fetchPlaybookData()
	}, [playbookId, navigate])

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

	if (isLoadingPlaybook) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading playbook...</p>
				</div>
			</div>
		)
	}

	if (playbookError) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-red-500">{playbookError}</p>
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
