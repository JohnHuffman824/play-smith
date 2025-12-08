import { useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { Canvas } from './components/Canvas'
import { PlayHeader } from './components/PlayHeader'
import { PlayCardsSection } from './components/PlayCardsSection'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import type { DrawingState, PlayCard } from './types/play.types'
import './index.css'

function AppContent() {
	const { theme } = useTheme()
	const [drawingState, setDrawingState] = useState<DrawingState>({
		tool: 'select',
		color: '#000000',
		brushSize: 3, // Default to "medium"
		lineStyle: 'solid',
		lineEnd: 'none',
		eraseSize: 40, // Default to medium size
	})

	const [formation, setFormation] = useState('')
	const [play, setPlay] = useState('')
	const [defensiveFormation, setDefensiveFormation] = useState('')
	const [playCards, setPlayCards] = useState<PlayCard[]>([])
	const [hashAlignment, setHashAlignment] = useState<'center' | 'left' | 'right'>('center')
	const [showPlayBar, setShowPlayBar] = useState(true)

	const handleAddPlayCard = () => {
		const newCard: PlayCard = {
			id: Date.now().toString(),
			name: `Play ${playCards.length + 1}`,
			thumbnail: '', // Will be populated with actual canvas data
		}
		setPlayCards([...playCards, newCard])
	}

	const handleDeletePlayCard = (id: string) => {
		setPlayCards(playCards.filter(card => card.id !== id))
	}

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Ignore if user is typing in an input field
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return
			}

			const key = event.key.toLowerCase()
			
			switch(key) {
				case 's':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'select' }))
					window.dispatchEvent(new CustomEvent('closeAllDialogs'))
					break
				case 'a':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'addPlayer' }))
					window.dispatchEvent(new CustomEvent('addPlayer'))
					window.dispatchEvent(new CustomEvent('closeAllDialogs'))
					break
				case 'd':
					event.preventDefault()
					window.dispatchEvent(new CustomEvent('triggerDrawTool'))
					break
				case 'e':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'erase' }))
					window.dispatchEvent(new CustomEvent('closeAllDialogs'))
					break
				case 'c':
					event.preventDefault()
					window.dispatchEvent(new CustomEvent('triggerColorPicker'))
					break
				case 'f':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'fill' }))
					window.dispatchEvent(new CustomEvent('closeAllDialogs'))
					break
				case 'r':
					event.preventDefault()
					window.dispatchEvent(new CustomEvent('triggerRouteTool'))
					break
				case 'h':
					event.preventDefault()
					window.dispatchEvent(new CustomEvent('triggerHashDialog'))
					break
				case 'g':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'addComponent' }))
					window.dispatchEvent(new CustomEvent('addComponent'))
					window.dispatchEvent(new CustomEvent('closeAllDialogs'))
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Toolbar 
				drawingState={drawingState}
				setDrawingState={setDrawingState}
				hashAlignment={hashAlignment}
				setHashAlignment={setHashAlignment}
				showPlayBar={showPlayBar}
				setShowPlayBar={setShowPlayBar}
			/>
			<div className='flex-1 flex flex-col'>
				<PlayHeader
					formation={formation}
					play={play}
					defensiveFormation={defensiveFormation}
					onFormationChange={setFormation}
					onPlayChange={setPlay}
					onDefensiveFormationChange={setDefensiveFormation}
				/>
				<Canvas drawingState={drawingState} hashAlignment={hashAlignment} showPlayBar={showPlayBar} />
				<PlayCardsSection
					playCards={playCards}
					onAddCard={handleAddPlayCard}
					onDeleteCard={handleDeletePlayCard}
					showPlayBar={showPlayBar}
				/>
			</div>
		</div>
	)
}

export default function App() {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	)
}
