/**
 * Concept state management context
 * Manages concept chips, formation selection, and multi-select mode
 */

import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { ConceptChip, Formation } from '../types/concept.types'

interface ConceptState {
	appliedConcepts: ConceptChip[]
	selectedFormation: Formation | null
	multiSelectMode: boolean
	selectedObjects: string[]
	isConceptDialogOpen: boolean
	editingConceptId: number | null
}

type ConceptAction =
	| { type: 'APPLY_CONCEPT'; chip: ConceptChip }
	| { type: 'REMOVE_CONCEPT'; chipId: string }
	| { type: 'REORDER_CONCEPTS'; chips: ConceptChip[] }
	| { type: 'SET_FORMATION'; formation: Formation | null }
	| { type: 'TOGGLE_MULTI_SELECT' }
	| { type: 'SET_MULTI_SELECT'; enabled: boolean }
	| { type: 'SELECT_OBJECT'; objectId: string }
	| { type: 'DESELECT_OBJECT'; objectId: string }
	| { type: 'SET_SELECTED_OBJECTS'; objectIds: string[] }
	| { type: 'CLEAR_SELECTION' }
	| { type: 'OPEN_CONCEPT_DIALOG'; conceptId?: number }
	| { type: 'CLOSE_CONCEPT_DIALOG' }
	| { type: 'RESET' }

interface ConceptContextType {
	state: ConceptState
	dispatch: React.Dispatch<ConceptAction>
	applyConcept: (chip: ConceptChip) => void
	removeConcept: (chipId: string) => void
	reorderConcepts: (chips: ConceptChip[]) => void
	setFormation: (formation: Formation | null) => void
	toggleMultiSelect: () => void
	setMultiSelect: (enabled: boolean) => void
	selectObject: (objectId: string) => void
	deselectObject: (objectId: string) => void
	setSelectedObjects: (objectIds: string[]) => void
	clearSelection: () => void
	openConceptDialog: (conceptId?: number) => void
	closeConceptDialog: () => void
	reset: () => void
}

const ConceptContext = createContext<ConceptContextType | undefined>(undefined)

const initialState: ConceptState = {
	appliedConcepts: [],
	selectedFormation: null,
	multiSelectMode: false,
	selectedObjects: [],
	isConceptDialogOpen: false,
	editingConceptId: null
}

type ApplyConceptAction = Extract<ConceptAction, { type: 'APPLY_CONCEPT' }>
type RemoveConceptAction = Extract<ConceptAction, { type: 'REMOVE_CONCEPT' }>
type ReorderConceptsAction = Extract<ConceptAction, { type: 'REORDER_CONCEPTS' }>
type SetFormationAction = Extract<ConceptAction, { type: 'SET_FORMATION' }>
type SetMultiSelectAction = Extract<ConceptAction, { type: 'SET_MULTI_SELECT' }>
type SelectObjectAction = Extract<ConceptAction, { type: 'SELECT_OBJECT' }>
type DeselectObjectAction = Extract<ConceptAction, { type: 'DESELECT_OBJECT' }>
type SetSelectedObjectsAction = Extract<ConceptAction, { type: 'SET_SELECTED_OBJECTS' }>
type OpenConceptDialogAction = Extract<ConceptAction, { type: 'OPEN_CONCEPT_DIALOG' }>

function applyApplyConcept(
	state: ConceptState,
	action: ApplyConceptAction
): ConceptState {
	return {
		...state,
		appliedConcepts: [...state.appliedConcepts, action.chip]
	}
}

function applyRemoveConcept(
	state: ConceptState,
	action: RemoveConceptAction
): ConceptState {
	return {
		...state,
		appliedConcepts: state.appliedConcepts.filter(c => c.id !== action.chipId)
	}
}

function applyReorderConcepts(
	state: ConceptState,
	action: ReorderConceptsAction
): ConceptState {
	return {
		...state,
		appliedConcepts: action.chips
	}
}

function applySetFormation(
	state: ConceptState,
	action: SetFormationAction
): ConceptState {
	return {
		...state,
		selectedFormation: action.formation
	}
}

function applyToggleMultiSelect(state: ConceptState): ConceptState {
	return {
		...state,
		multiSelectMode: !state.multiSelectMode,
		selectedObjects: !state.multiSelectMode ? state.selectedObjects : []
	}
}

function applySetMultiSelect(
	state: ConceptState,
	action: SetMultiSelectAction
): ConceptState {
	return {
		...state,
		multiSelectMode: action.enabled,
		selectedObjects: action.enabled ? state.selectedObjects : []
	}
}

function applySelectObject(
	state: ConceptState,
	action: SelectObjectAction
): ConceptState {
	if (state.selectedObjects.includes(action.objectId)) {
		return state
	}
	return {
		...state,
		selectedObjects: [...state.selectedObjects, action.objectId]
	}
}

function applyDeselectObject(
	state: ConceptState,
	action: DeselectObjectAction
): ConceptState {
	return {
		...state,
		selectedObjects: state.selectedObjects.filter(id => id !== action.objectId)
	}
}

function applySetSelectedObjects(
	state: ConceptState,
	action: SetSelectedObjectsAction
): ConceptState {
	return {
		...state,
		selectedObjects: action.objectIds
	}
}

function applyClearSelection(state: ConceptState): ConceptState {
	return {
		...state,
		selectedObjects: [],
		multiSelectMode: false
	}
}

function applyOpenConceptDialog(
	state: ConceptState,
	action: OpenConceptDialogAction
): ConceptState {
	return {
		...state,
		isConceptDialogOpen: true,
		editingConceptId: action.conceptId ?? null
	}
}

function applyCloseConceptDialog(state: ConceptState): ConceptState {
	return {
		...state,
		isConceptDialogOpen: false,
		editingConceptId: null
	}
}

function applyReset(): ConceptState {
	return initialState
}

function conceptReducer(state: ConceptState, action: ConceptAction): ConceptState {
	switch (action.type) {
		case 'APPLY_CONCEPT':
			return applyApplyConcept(state, action)
		case 'REMOVE_CONCEPT':
			return applyRemoveConcept(state, action)
		case 'REORDER_CONCEPTS':
			return applyReorderConcepts(state, action)
		case 'SET_FORMATION':
			return applySetFormation(state, action)
		case 'TOGGLE_MULTI_SELECT':
			return applyToggleMultiSelect(state)
		case 'SET_MULTI_SELECT':
			return applySetMultiSelect(state, action)
		case 'SELECT_OBJECT':
			return applySelectObject(state, action)
		case 'DESELECT_OBJECT':
			return applyDeselectObject(state, action)
		case 'SET_SELECTED_OBJECTS':
			return applySetSelectedObjects(state, action)
		case 'CLEAR_SELECTION':
			return applyClearSelection(state)
		case 'OPEN_CONCEPT_DIALOG':
			return applyOpenConceptDialog(state, action)
		case 'CLOSE_CONCEPT_DIALOG':
			return applyCloseConceptDialog(state)
		case 'RESET':
			return applyReset()
		default:
			return state
	}
}

export function ConceptProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(conceptReducer, initialState)

	const applyConcept = (chip: ConceptChip) => {
		dispatch({ type: 'APPLY_CONCEPT', chip })
	}

	const removeConcept = (chipId: string) => {
		dispatch({ type: 'REMOVE_CONCEPT', chipId })
	}

	const reorderConcepts = (chips: ConceptChip[]) => {
		dispatch({ type: 'REORDER_CONCEPTS', chips })
	}

	const setFormation = (formation: Formation | null) => {
		dispatch({ type: 'SET_FORMATION', formation })
	}

	const toggleMultiSelect = () => {
		dispatch({ type: 'TOGGLE_MULTI_SELECT' })
	}

	const setMultiSelect = (enabled: boolean) => {
		dispatch({ type: 'SET_MULTI_SELECT', enabled })
	}

	const selectObject = (objectId: string) => {
		dispatch({ type: 'SELECT_OBJECT', objectId })
	}

	const deselectObject = (objectId: string) => {
		dispatch({ type: 'DESELECT_OBJECT', objectId })
	}

	const setSelectedObjects = (objectIds: string[]) => {
		dispatch({ type: 'SET_SELECTED_OBJECTS', objectIds })
	}

	const clearSelection = () => {
		dispatch({ type: 'CLEAR_SELECTION' })
	}

	const openConceptDialog = (conceptId?: number) => {
		dispatch({ type: 'OPEN_CONCEPT_DIALOG', conceptId })
	}

	const closeConceptDialog = () => {
		dispatch({ type: 'CLOSE_CONCEPT_DIALOG' })
	}

	const reset = () => {
		dispatch({ type: 'RESET' })
	}

	return (
		<ConceptContext.Provider
			value={{
				state,
				dispatch,
				applyConcept,
				removeConcept,
				reorderConcepts,
				setFormation,
				toggleMultiSelect,
				setMultiSelect,
				selectObject,
				deselectObject,
				setSelectedObjects,
				clearSelection,
				openConceptDialog,
				closeConceptDialog,
				reset
			}}
		>
			{children}
		</ConceptContext.Provider>
	)
}

export function useConcept() {
	const context = useContext(ConceptContext)
	if (!context) {
		throw new Error('useConcept must be used within ConceptProvider')
	}
	return context
}
