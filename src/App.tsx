import { Toolbar } from './components/toolbar/Toolbar'
import { Canvas } from './components/canvas/Canvas'
import { PlayHeader } from './components/plays/PlayHeader'
import { PlayCardsSection } from './components/plays/PlayCardsSection'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { PlayProvider, usePlayContext } from './contexts/PlayContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginModal } from './components/auth/LoginModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './index.css'

// Loading spinner shown while checking auth session
function LoadingScreen() {
	return (
		<div className="flex h-screen items-center justify-center bg-gray-50">
			<div className="text-gray-500">Loading...</div>
		</div>
	)
}

function AppContent() {
	const { theme } = useTheme()
	const {
		state,
		setDrawingState,
		setFormation,
		setPlay,
		setDefensiveFormation,
		addPlayCard,
		deletePlayCard,
		setHashAlignment,
		setShowPlayBar,
	} = usePlayContext()
	useKeyboardShortcuts({ setDrawingState })

	return (
		<div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Toolbar
				drawingState={state.drawingState}
				setDrawingState={setDrawingState}
				hashAlignment={state.hashAlignment}
				setHashAlignment={setHashAlignment}
				showPlayBar={state.showPlayBar}
				setShowPlayBar={setShowPlayBar}
			/>
			<div className="flex-1 flex flex-col">
				<PlayHeader
					formation={state.formation}
					play={state.play}
					defensiveFormation={state.defensiveFormation}
					onFormationChange={setFormation}
					onPlayChange={setPlay}
					onDefensiveFormationChange={setDefensiveFormation}
				/>
				<Canvas
					drawingState={state.drawingState}
					hashAlignment={state.hashAlignment}
					showPlayBar={state.showPlayBar}
				/>
				<PlayCardsSection
					playCards={state.playCards}
					onAddCard={addPlayCard}
					onDeleteCard={deletePlayCard}
					showPlayBar={state.showPlayBar}
				/>
			</div>
		</div>
	)
}

// Gates app content behind authentication
function AuthGate() {
	const { isLoading, isAuthenticated } = useAuth()

	if (isLoading) {
		return <LoadingScreen />
	}

	if (!isAuthenticated) {
		return <LoginModal />
	}

	return (
		<PlayProvider>
			<AppContent />
		</PlayProvider>
	)
}

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AuthGate />
			</AuthProvider>
		</ThemeProvider>
	)
}
