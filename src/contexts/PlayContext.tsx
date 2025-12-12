/**
* Play state management context
* Provides centralized state management for the play editor
* Eliminates props drilling through multiple component levels
*/

import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { DrawingState, Tool } from '../types/play.types'
import type { HashAlignment } from '../types/field.types'
import type { Drawing } from '../types/drawing.types'
import type { Formation, BaseConcept, ConceptGroup } from '../types/concept.types'
import { useTheme } from './ThemeContext'
import { repositionLinemenForHash } from '../utils/lineman.utils'

interface Player {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman?: boolean
}

interface PlayCard {
	id: string
	name: string
}

interface PlayState {
	drawingState: DrawingState
	formation: string
	play: string
	defensiveFormation: string
	hashAlignment: HashAlignment
	showPlayBar: boolean
	players: Player[]
	drawings: Drawing[]
	playCards: PlayCard[]
}

type PlayAction =
	| { type: 'SET_TOOL'; tool: Tool }
	| { type: 'SET_DRAWING_STATE'; drawingState: Partial<DrawingState> }
	| { type: 'SET_FORMATION'; formation: string }
	| { type: 'SET_PLAY'; play: string }
	| { type: 'SET_DEFENSIVE_FORMATION'; defensiveFormation: string }
	| { type: 'SET_HASH_ALIGNMENT'; alignment: HashAlignment }
	| { type: 'REPOSITION_LINEMEN_FOR_HASH'; alignment: HashAlignment }
	| { type: 'TOGGLE_PLAY_BAR' }
	| { type: 'SET_SHOW_PLAY_BAR'; show: boolean }
	| { type: 'SET_PLAYERS'; players: Player[] }
	| { type: 'ADD_PLAYER'; player: Player }
	| { type: 'UPDATE_PLAYER'; id: string; updates: Partial<Player> }
	| { type: 'DELETE_PLAYER'; id: string }
	| { type: 'ADD_DRAWING'; drawing: Drawing }
	| { type: 'SET_DRAWINGS'; drawings: Drawing[] }
	| { type: 'DELETE_DRAWING'; id: string }
	| { type: 'UPDATE_DRAWING'; id: string; updates: Partial<Drawing> }
	| { type: 'CLEAR_CANVAS' }
	| { type: 'APPLY_FORMATION'; formation: Formation }
	| { type: 'APPLY_CONCEPT'; concept: BaseConcept }
	| { type: 'APPLY_CONCEPT_GROUP'; conceptGroup: ConceptGroup }
	| { type: 'ADD_PLAY_CARD' }
	| { type: 'DELETE_PLAY_CARD'; id: string }

interface PlayContextType {
	state: PlayState
	dispatch: React.Dispatch<PlayAction>
	// Convenience methods
	setTool: (tool: Tool) => void
	setDrawingState: (updates: Partial<DrawingState>) => void
	setFormation: (formation: string) => void
	setPlay: (play: string) => void
	setDefensiveFormation: (formation: string) => void
	addPlayCard: () => void
	deletePlayCard: (id: string) => void
	setHashAlignment: (alignment: HashAlignment) => void
	setShowPlayBar: (show: boolean) => void
	setPlayers: (players: Player[]) => void
	setDrawings: (drawings: Drawing[]) => void
	addDrawing: (drawing: Drawing) => void
	deleteDrawing: (id: string) => void
	updateDrawing: (id: string, updates: Partial<Drawing>) => void
	applyFormation: (formation: Formation) => void
	applyConcept: (concept: BaseConcept) => void
	applyConceptGroup: (conceptGroup: ConceptGroup) => void
}

const PlayContext = createContext<PlayContextType | undefined>(undefined)

const initialState: PlayState = {
	drawingState: {
		tool: 'select',
		color: '#000000',
		brushSize: 3,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
		eraseSize: 40,
		snapThreshold: 20,
	},
	formation: '',
	play: '',
	defensiveFormation: '',
	hashAlignment: 'middle',
	showPlayBar: true,
	players: [],
	drawings: [],
	playCards: [],
}

type SetToolAction = Extract<PlayAction, { type: 'SET_TOOL' }>
type SetDrawingStateAction = Extract<PlayAction, { type: 'SET_DRAWING_STATE' }>
type SetFormationAction = Extract<PlayAction, { type: 'SET_FORMATION' }>
type SetPlayAction = Extract<PlayAction, { type: 'SET_PLAY' }>
type SetDefensiveFormationAction = Extract<
	PlayAction,
	{ type: 'SET_DEFENSIVE_FORMATION' }
>
type SetHashAlignmentAction = Extract<
	PlayAction,
	{ type: 'SET_HASH_ALIGNMENT' }
>
type SetShowPlayBarAction = Extract<PlayAction, { type: 'SET_SHOW_PLAY_BAR' }>
type SetPlayersAction = Extract<PlayAction, { type: 'SET_PLAYERS' }>
type AddPlayerAction = Extract<PlayAction, { type: 'ADD_PLAYER' }>
type UpdatePlayerAction = Extract<PlayAction, { type: 'UPDATE_PLAYER' }>
type DeletePlayerAction = Extract<PlayAction, { type: 'DELETE_PLAYER' }>
type AddDrawingAction = Extract<PlayAction, { type: 'ADD_DRAWING' }>
type SetDrawingsAction = Extract<PlayAction, { type: 'SET_DRAWINGS' }>
type DeleteDrawingAction = Extract<PlayAction, { type: 'DELETE_DRAWING' }>
type UpdateDrawingAction = Extract<PlayAction, { type: 'UPDATE_DRAWING' }>
type ApplyFormationAction = Extract<PlayAction, { type: 'APPLY_FORMATION' }>
type ApplyConceptAction = Extract<PlayAction, { type: 'APPLY_CONCEPT' }>
type ApplyConceptGroupAction = Extract<PlayAction, { type: 'APPLY_CONCEPT_GROUP' }>
type AddPlayCardAction = Extract<PlayAction, { type: 'ADD_PLAY_CARD' }>
type DeletePlayCardAction = Extract<PlayAction, { type: 'DELETE_PLAY_CARD' }>

function applySetTool(
	state: PlayState,
	action: SetToolAction,
): PlayState {
	return {
		...state,
		drawingState: { ...state.drawingState, tool: action.tool },
	}
}

function applySetDrawingState(
	state: PlayState,
	action: SetDrawingStateAction,
): PlayState {
	return {
		...state,
		drawingState: { ...state.drawingState, ...action.drawingState },
	}
}

function applySetFormation(
	state: PlayState,
	action: SetFormationAction,
): PlayState {
	return { ...state, formation: action.formation }
}

function applySetPlay(
	state: PlayState,
	action: SetPlayAction,
): PlayState {
	return { ...state, play: action.play }
}

function applySetDefensiveFormation(
	state: PlayState,
	action: SetDefensiveFormationAction,
): PlayState {
	return { ...state, defensiveFormation: action.defensiveFormation }
}

function applySetHashAlignment(
	state: PlayState,
	action: SetHashAlignmentAction,
): PlayState {
	return { ...state, hashAlignment: action.alignment }
}

function applyTogglePlayBar(state: PlayState): PlayState {
	return { ...state, showPlayBar: !state.showPlayBar }
}

function applySetShowPlayBar(
	state: PlayState,
	action: SetShowPlayBarAction,
): PlayState {
	return { ...state, showPlayBar: action.show }
}

function applySetPlayers(
	state: PlayState,
	action: SetPlayersAction,
): PlayState {
	return { ...state, players: action.players }
}

function applyAddPlayer(
	state: PlayState,
	action: AddPlayerAction,
): PlayState {
	return { ...state, players: [...state.players, action.player] }
}

function applyUpdatePlayer(
	state: PlayState,
	action: UpdatePlayerAction,
): PlayState {
	return {
		...state,
		players: state.players.map((player) =>
			player.id == action.id ? { ...player, ...action.updates } : player,
		),
	}
}

function applyDeletePlayer(
	state: PlayState,
	action: DeletePlayerAction,
): PlayState {
	return {
		...state,
		players: state.players.filter((player) => player.id != action.id),
	}
}

function applyAddDrawing(
	state: PlayState,
	action: AddDrawingAction,
): PlayState {
	return { ...state, drawings: [...state.drawings, action.drawing] }
}

function applySetDrawings(
	state: PlayState,
	action: SetDrawingsAction,
): PlayState {
	return { ...state, drawings: action.drawings }
}

function applyDeleteDrawing(
	state: PlayState,
	action: DeleteDrawingAction,
): PlayState {
	return {
		...state,
		drawings: state.drawings.filter((drawing) => drawing.id != action.id),
	}
}

function applyUpdateDrawing(
	state: PlayState,
	action: UpdateDrawingAction,
): PlayState {
	return {
		...state,
		drawings: state.drawings.map((drawing) =>
			drawing.id == action.id
				? { ...drawing, ...action.updates }
				: drawing,
		),
	}
}

function applyClearCanvas(state: PlayState): PlayState {
	return { ...state, drawings: [], players: [] }
}

function applyApplyFormation(
	state: PlayState,
	action: ApplyFormationAction
): PlayState {
	const newPlayers: Player[] = action.formation.positions?.map(pos => ({
		id: `player-${pos.role}-${Date.now()}-${Math.random()}`,
		x: pos.position_x,
		y: pos.position_y,
		label: pos.role,
		color: '#000000'
	})) ?? []

	return {
		...state,
		players: [...state.players, ...newPlayers]
	}
}

function applyApplyConcept(
	state: PlayState,
	action: ApplyConceptAction
): PlayState {
	const newDrawings: Drawing[] = action.concept.assignments?.map(assignment =>
		assignment.drawing_data
	) ?? []

	return {
		...state,
		drawings: [...state.drawings, ...newDrawings]
	}
}

function applyApplyConceptGroup(
	state: PlayState,
	action: ApplyConceptGroupAction
): PlayState {
	let newState = state

	if (action.conceptGroup.formation) {
		newState = applyApplyFormation(newState, {
			type: 'APPLY_FORMATION',
			formation: action.conceptGroup.formation
		})
	}

	if (action.conceptGroup.concepts) {
		for (const concept of action.conceptGroup.concepts) {
			newState = applyApplyConcept(newState, {
				type: 'APPLY_CONCEPT',
				concept
			})
		}
	}

	return newState
}

function applyRepositionLinemenForHash(
	state: PlayState,
	action: { type: 'REPOSITION_LINEMEN_FOR_HASH'; alignment: HashAlignment }
): PlayState {
	return {
		...state,
		hashAlignment: action.alignment,
		players: repositionLinemenForHash(state.players, action.alignment),
	}
}

function applyAddPlayCard(state: PlayState): PlayState {
	const newCard: PlayCard = {
		id: `play-card-${Date.now()}`,
		name: `Play ${state.playCards.length + 1}`,
	}
	return {
		...state,
		playCards: [...state.playCards, newCard],
	}
}

function applyDeletePlayCard(
	state: PlayState,
	action: DeletePlayCardAction
): PlayState {
	return {
		...state,
		playCards: state.playCards.filter((card) => card.id !== action.id),
	}
}

/**
* Reducer handling play state transitions.
*/
function playReducer(state: PlayState, action: PlayAction): PlayState {
	switch (action.type) {
		case 'SET_TOOL':
			return applySetTool(state, action)
		case 'SET_DRAWING_STATE':
			return applySetDrawingState(state, action)
		case 'SET_FORMATION':
			return applySetFormation(state, action)
		case 'SET_PLAY':
			return applySetPlay(state, action)
		case 'SET_DEFENSIVE_FORMATION':
			return applySetDefensiveFormation(state, action)
		case 'SET_HASH_ALIGNMENT':
			return applySetHashAlignment(state, action)
		case 'REPOSITION_LINEMEN_FOR_HASH':
			return applyRepositionLinemenForHash(state, action)
		case 'TOGGLE_PLAY_BAR':
			return applyTogglePlayBar(state)
		case 'SET_SHOW_PLAY_BAR':
			return applySetShowPlayBar(state, action)
		case 'SET_PLAYERS':
			return applySetPlayers(state, action)
		case 'ADD_PLAYER':
			return applyAddPlayer(state, action)
		case 'UPDATE_PLAYER':
			return applyUpdatePlayer(state, action)
		case 'DELETE_PLAYER':
			return applyDeletePlayer(state, action)
		case 'ADD_DRAWING':
			return applyAddDrawing(state, action)
		case 'SET_DRAWINGS':
			return applySetDrawings(state, action)
		case 'DELETE_DRAWING':
			return applyDeleteDrawing(state, action)
		case 'UPDATE_DRAWING':
			return applyUpdateDrawing(state, action)
		case 'CLEAR_CANVAS':
			return applyClearCanvas(state)
		case 'APPLY_FORMATION':
			return applyApplyFormation(state, action)
		case 'APPLY_CONCEPT':
			return applyApplyConcept(state, action)
		case 'APPLY_CONCEPT_GROUP':
			return applyApplyConceptGroup(state, action)
		case 'ADD_PLAY_CARD':
			return applyAddPlayCard(state)
		case 'DELETE_PLAY_CARD':
			return applyDeletePlayCard(state, action)
		default:
			return state
	}
}

const DRAW_COLOR_STORAGE_KEY = 'playsmith-draw-color'

/**
* Provides play context and actions to descendants.
*/
export function PlayProvider({ children }: { children: ReactNode }) {
	const { theme } = useTheme()

	// Check localStorage for saved color, fallback to theme default
	const savedColor = localStorage.getItem(DRAW_COLOR_STORAGE_KEY)
	const defaultColor = savedColor || (theme === 'dark' ? '#FFFFFF' : '#000000')

	// Create theme-aware initial state
	const themeAwareInitialState: PlayState = {
		...initialState,
		drawingState: {
			...initialState.drawingState,
			color: defaultColor,
		},
	}

	const [state, dispatch] = useReducer(playReducer, themeAwareInitialState)

	// Memoize all convenience methods to prevent infinite loops in components
	const setTool = useCallback((tool: Tool) => {
		dispatch({ type: 'SET_TOOL', tool })
	}, [])

	const setDrawingState = useCallback((updates: Partial<DrawingState>) => {
		dispatch({ type: 'SET_DRAWING_STATE', drawingState: updates })
	}, [])

	const setFormation = useCallback((formation: string) => {
		dispatch({ type: 'SET_FORMATION', formation })
	}, [])

	const setPlay = useCallback((play: string) => {
		dispatch({ type: 'SET_PLAY', play })
	}, [])

	const setDefensiveFormation = useCallback((formation: string) => {
		dispatch({ type: 'SET_DEFENSIVE_FORMATION', defensiveFormation: formation })
	}, [])

	const setHashAlignment = useCallback((alignment: HashAlignment) => {
		dispatch({ type: 'REPOSITION_LINEMEN_FOR_HASH', alignment })
	}, [])

	const setShowPlayBar = useCallback((show: boolean) => {
		dispatch({ type: 'SET_SHOW_PLAY_BAR', show })
	}, [])

	const setPlayers = useCallback((players: Player[]) => {
		dispatch({ type: 'SET_PLAYERS', players })
	}, [])

	const setDrawings = useCallback((drawings: Drawing[]) => {
		dispatch({ type: 'SET_DRAWINGS', drawings })
	}, [])

	const addDrawing = useCallback((drawing: Drawing) => {
		dispatch({ type: 'ADD_DRAWING', drawing })
	}, [])

	const deleteDrawing = useCallback((id: string) => {
		dispatch({ type: 'DELETE_DRAWING', id })
	}, [])

	const updateDrawing = useCallback((id: string, updates: Partial<Drawing>) => {
		dispatch({ type: 'UPDATE_DRAWING', id, updates })
	}, [])

	const applyFormation = useCallback((formation: Formation) => {
		dispatch({ type: 'APPLY_FORMATION', formation })
	}, [])

	const applyConcept = useCallback((concept: BaseConcept) => {
		dispatch({ type: 'APPLY_CONCEPT', concept })
	}, [])

	const applyConceptGroup = useCallback((conceptGroup: ConceptGroup) => {
		dispatch({ type: 'APPLY_CONCEPT_GROUP', conceptGroup })
	}, [])

	const addPlayCard = useCallback(() => {
		dispatch({ type: 'ADD_PLAY_CARD' })
	}, [])

	const deletePlayCard = useCallback((id: string) => {
		dispatch({ type: 'DELETE_PLAY_CARD', id })
	}, [])

	// Save draw color to localStorage when it changes
	useEffect(() => {
		if (state.drawingState.color) {
			localStorage.setItem(DRAW_COLOR_STORAGE_KEY, state.drawingState.color)
		}
	}, [state.drawingState.color])

	// Memoize the context value to prevent unnecessary re-renders
	const value = useMemo<PlayContextType>(() => ({
		state,
		dispatch,
		setTool,
		setDrawingState,
		setFormation,
		setPlay,
		setDefensiveFormation,
		addPlayCard,
		deletePlayCard,
		setHashAlignment,
		setShowPlayBar,
		setPlayers,
		setDrawings,
		addDrawing,
		deleteDrawing,
		updateDrawing,
		applyFormation,
		applyConcept,
		applyConceptGroup,
	}), [
		state,
		setTool,
		setDrawingState,
		setFormation,
		setPlay,
		setDefensiveFormation,
		addPlayCard,
		deletePlayCard,
		setHashAlignment,
		setShowPlayBar,
		setPlayers,
		setDrawings,
		addDrawing,
		deleteDrawing,
		updateDrawing,
		applyFormation,
		applyConcept,
		applyConceptGroup,
	])

	return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>
}

/**
* Hook to access play context
* Must be used within a PlayProvider
*/
export function usePlayContext() {
	const context = useContext(PlayContext)
	if (context == undefined) {
		throw new Error('usePlayContext must be used within a PlayProvider')
	}
	return context
}
