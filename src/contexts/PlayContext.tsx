/**
 * Play state management context
 * Provides centralized state management for the play editor
 * Eliminates props drilling through multiple component levels
 */

import { createContext, useContext, useReducer, ReactNode } from 'react'
import type { DrawingState, PlayCard, Tool } from '../types/play.types'
import type { HashAlignment } from '../types/field.types'
import type { DrawingObject } from '../types/drawing.types'

interface Player {
	id: string
	x: number
	y: number
	label: string
	color: string
}

interface PlayState {
	drawingState: DrawingState
	formation: string
	play: string
	defensiveFormation: string
	playCards: PlayCard[]
	hashAlignment: HashAlignment
	showPlayBar: boolean
	players: Player[]
	drawings: DrawingObject[]
}

type PlayAction =
	| { type: 'SET_TOOL'; tool: Tool }
	| { type: 'SET_DRAWING_STATE'; drawingState: Partial<DrawingState> }
	| { type: 'SET_FORMATION'; formation: string }
	| { type: 'SET_PLAY'; play: string }
	| { type: 'SET_DEFENSIVE_FORMATION'; defensiveFormation: string }
	| { type: 'ADD_PLAY_CARD'; card: PlayCard }
	| { type: 'DELETE_PLAY_CARD'; id: string }
	| { type: 'SET_HASH_ALIGNMENT'; alignment: HashAlignment }
	| { type: 'TOGGLE_PLAY_BAR' }
	| { type: 'SET_SHOW_PLAY_BAR'; show: boolean }
	| { type: 'ADD_PLAYER'; player: Player }
	| { type: 'UPDATE_PLAYER'; id: string; updates: Partial<Player> }
	| { type: 'DELETE_PLAYER'; id: string }
	| { type: 'ADD_DRAWING'; drawing: DrawingObject }
	| { type: 'SET_DRAWINGS'; drawings: DrawingObject[] }
	| { type: 'CLEAR_CANVAS' }

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
}

const PlayContext = createContext<PlayContextType | undefined>(undefined)

const initialState: PlayState = {
	drawingState: {
		tool: 'select',
		color: '#000000',
		brushSize: 3,
		lineStyle: 'solid',
		lineEnd: 'none',
		eraseSize: 40,
	},
	formation: '',
	play: '',
	defensiveFormation: '',
	playCards: [],
	hashAlignment: 'center',
	showPlayBar: true,
	players: [],
	drawings: [],
}

function playReducer(state: PlayState, action: PlayAction): PlayState {
	switch (action.type) {
		case 'SET_TOOL':
			return {
				...state,
				drawingState: { ...state.drawingState, tool: action.tool },
			}
		
		case 'SET_DRAWING_STATE':
			return {
				...state,
				drawingState: { ...state.drawingState, ...action.drawingState },
			}
		
		case 'SET_FORMATION':
			return { ...state, formation: action.formation }
		
		case 'SET_PLAY':
			return { ...state, play: action.play }
		
		case 'SET_DEFENSIVE_FORMATION':
			return { ...state, defensiveFormation: action.defensiveFormation }
		
		case 'ADD_PLAY_CARD':
			return { ...state, playCards: [...state.playCards, action.card] }
		
		case 'DELETE_PLAY_CARD':
			return {
				...state,
				playCards: state.playCards.filter(card => card.id !== action.id),
			}
		
		case 'SET_HASH_ALIGNMENT':
			return { ...state, hashAlignment: action.alignment }
		
		case 'TOGGLE_PLAY_BAR':
			return { ...state, showPlayBar: !state.showPlayBar }
		
		case 'SET_SHOW_PLAY_BAR':
			return { ...state, showPlayBar: action.show }
		
		case 'ADD_PLAYER':
			return { ...state, players: [...state.players, action.player] }
		
		case 'UPDATE_PLAYER':
			return {
				...state,
				players: state.players.map(p =>
					p.id === action.id ? { ...p, ...action.updates } : p
				),
			}
		
		case 'DELETE_PLAYER':
			return {
				...state,
				players: state.players.filter(p => p.id !== action.id),
			}
		
		case 'ADD_DRAWING':
			return { ...state, drawings: [...state.drawings, action.drawing] }
		
		case 'SET_DRAWINGS':
			return { ...state, drawings: action.drawings }
		
		case 'CLEAR_CANVAS':
			return { ...state, drawings: [], players: [] }
		
		default:
			return state
	}
}

export function PlayProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(playReducer, initialState)

	// Convenience methods
	const setTool = (tool: Tool) => dispatch({ type: 'SET_TOOL', tool })
	
	const setDrawingState = (updates: Partial<DrawingState>) =>
		dispatch({ type: 'SET_DRAWING_STATE', drawingState: updates })
	
	const setFormation = (formation: string) =>
		dispatch({ type: 'SET_FORMATION', formation })
	
	const setPlay = (play: string) =>
		dispatch({ type: 'SET_PLAY', play })
	
	const setDefensiveFormation = (formation: string) =>
		dispatch({ type: 'SET_DEFENSIVE_FORMATION', defensiveFormation: formation })
	
	const addPlayCard = () => {
		const newCard: PlayCard = {
			id: Date.now().toString(),
			name: `Play ${state.playCards.length + 1}`,
			thumbnail: '',
		}
		dispatch({ type: 'ADD_PLAY_CARD', card: newCard })
	}
	
	const deletePlayCard = (id: string) =>
		dispatch({ type: 'DELETE_PLAY_CARD', id })
	
	const setHashAlignment = (alignment: HashAlignment) =>
		dispatch({ type: 'SET_HASH_ALIGNMENT', alignment })
	
	const setShowPlayBar = (show: boolean) =>
		dispatch({ type: 'SET_SHOW_PLAY_BAR', show })

	const value: PlayContextType = {
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
	}

	return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>
}

/**
 * Hook to access play context
 * Must be used within a PlayProvider
 */
export function usePlayContext() {
	const context = useContext(PlayContext)
	if (context === undefined) {
		throw new Error('usePlayContext must be used within a PlayProvider')
	}
	return context
}
