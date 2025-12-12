/**
 * Tests for PlayContext
 * Verifies state management and reducer logic
 */

import { afterEach, describe, it, expect } from 'bun:test'
import { cleanup, renderHook, act } from '@testing-library/react'
import { PlayProvider, usePlayContext } from '../../../src/contexts/PlayContext'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'
import { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
	<ThemeProvider>
		<PlayProvider>{children}</PlayProvider>
	</ThemeProvider>
)

describe('PlayContext', () => {

	afterEach(() => {
		cleanup()
	})

	describe('initialization', () => {
		it('should provide initial state', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })

			expect(result.current.state.drawingState.tool).toBe('select')
			expect(result.current.state.formation).toBe('')
			expect(result.current.state.hashAlignment).toBe('middle')
			expect(result.current.state.showPlayBar).toBe(true)
		})

		it('should throw error when used outside provider', () => {
			expect(() => {
				renderHook(() => usePlayContext())
			}).toThrow('usePlayContext must be used within a PlayProvider')
		})
	})

	describe('tool management', () => {
		it('should update tool', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setTool('draw')
			})
			
			expect(result.current.state.drawingState.tool).toBe('draw')
		})

		it('should update drawing state properties', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setDrawingState({ 
					color: '#ff0000',
					brushSize: 5 
				})
			})
			
			expect(result.current.state.drawingState.color).toBe('#ff0000')
			expect(result.current.state.drawingState.brushSize).toBe(5)
			expect(result.current.state.drawingState.tool).toBe('select') // Unchanged
		})
	})

	describe('formation management', () => {
		it('should update formation', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setFormation('I-Formation')
			})
			
			expect(result.current.state.formation).toBe('I-Formation')
		})

		it('should update play name', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setPlay('Power Run')
			})
			
			expect(result.current.state.play).toBe('Power Run')
		})

		it('should update defensive formation', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setDefensiveFormation('4-3 Defense')
			})
			
			expect(result.current.state.defensiveFormation).toBe('4-3 Defense')
		})
	})

	describe('hash alignment', () => {
		it('should update hash alignment', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.setHashAlignment('left')
			})
			
			expect(result.current.state.hashAlignment).toBe('left')
		})

		it('should support all alignment options', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })

			const alignments: Array<'middle' | 'left' | 'right'> = ['middle', 'left', 'right']

			alignments.forEach(alignment => {
				act(() => {
					result.current.setHashAlignment(alignment)
				})
				expect(result.current.state.hashAlignment).toBe(alignment)
			})
		})
	})

	describe('play bar visibility', () => {
		it('should toggle play bar', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			expect(result.current.state.showPlayBar).toBe(true)
			
			act(() => {
				result.current.setShowPlayBar(false)
			})
			
			expect(result.current.state.showPlayBar).toBe(false)
		})
	})

	describe('reducer dispatch', () => {
		it('should handle ADD_PLAYER action', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			act(() => {
				result.current.dispatch({
					type: 'ADD_PLAYER',
					player: {
						id: 'player-1',
						x: 80,
						y: 30,
						label: 'QB',
						color: '#ff0000',
					},
				})
			})
			
			expect(result.current.state.players).toHaveLength(1)
			expect(result.current.state.players[0]?.label).toBe('QB')
		})

		it('should handle CLEAR_CANVAS action', () => {
			const { result } = renderHook(() => usePlayContext(), { wrapper })
			
			// Add some data first
			act(() => {
				result.current.dispatch({
					type: 'ADD_PLAYER',
					player: {
						id: 'player-1',
						x: 80,
						y: 30,
						label: 'QB',
						color: '#ff0000',
					},
				})
				result.current.dispatch({
					type: 'ADD_DRAWING',
					drawing: {
						id: 'drawing-1',
						type: 'draw',
						points: [],
						color: '#000000',
						brushSize: 3,
						lineStyle: 'solid',
						lineEnd: 'none',
						eraseSize: 40,
					},
				})
			})
			
			expect(result.current.state.players).toHaveLength(1)
			expect(result.current.state.drawings).toHaveLength(1)
			
			act(() => {
				result.current.dispatch({ type: 'CLEAR_CANVAS' })
			})
			
			expect(result.current.state.players).toHaveLength(0)
			expect(result.current.state.drawings).toHaveLength(0)
		})
	})
})
