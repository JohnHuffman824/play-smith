import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ViewportState {
  zoom: number
  panX: number
  panY: number
  isPanning: boolean
  panMode: 'spacebar' | 'middleMouse' | null
}

interface CanvasViewportContextType {
  zoom: number
  panX: number
  panY: number
  isPanning: boolean
  panMode: 'spacebar' | 'middleMouse' | null
  setZoom: (zoom: number) => void
  setPan: (panX: number, panY: number) => void
  setViewport: (state: Partial<ViewportState>) => void
  resetViewport: () => void
}

const CanvasViewportContext = createContext<CanvasViewportContextType | undefined>(undefined)

const INITIAL_STATE: ViewportState = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isPanning: false,
  panMode: null,
}

export function CanvasViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewportState] = useState<ViewportState>(INITIAL_STATE)

  const setZoom = useCallback((zoom: number) => {
    setViewportState(prev => ({ ...prev, zoom }))
  }, [])

  const setPan = useCallback((panX: number, panY: number) => {
    setViewportState(prev => ({ ...prev, panX, panY }))
  }, [])

  const setViewport = useCallback((state: Partial<ViewportState>) => {
    setViewportState(prev => ({ ...prev, ...state }))
  }, [])

  const resetViewport = useCallback(() => {
    setViewportState(INITIAL_STATE)
  }, [])

  return (
    <CanvasViewportContext.Provider
      value={{
        zoom: viewport.zoom,
        panX: viewport.panX,
        panY: viewport.panY,
        isPanning: viewport.isPanning,
        panMode: viewport.panMode,
        setZoom,
        setPan,
        setViewport,
        resetViewport,
      }}
    >
      {children}
    </CanvasViewportContext.Provider>
  )
}

export function useCanvasViewport() {
  const context = useContext(CanvasViewportContext)
  if (context === undefined) {
    throw new Error('useCanvasViewport must be used within a CanvasViewportProvider')
  }
  return context
}
