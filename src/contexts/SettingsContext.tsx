import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

// Global settings types
type Theme = 'light' | 'dark' | 'system'
type PositionNaming = 'traditional' | 'modern' | 'numeric'
type FieldLevel = 'high-school' | 'college' | 'pro'
type Personnel = '11' | '10' | '12' | '13' | '21' | '22'

// Playbook Manager settings types
type ViewMode = 'grid' | 'list'
type AutoSaveInterval = '10' | '30' | '60' | '300' | 'manual'

// Sidebar width constants
export const MIN_SIDEBAR_WIDTH = 200
export const MAX_SIDEBAR_WIDTH = 400
export const DEFAULT_SIDEBAR_WIDTH = 256

interface SettingsContextType {
	// Global settings (all contexts)
	theme: Theme
	setTheme: (theme: Theme) => void
	positionNaming: PositionNaming
	setPositionNaming: (naming: PositionNaming) => void
	fieldLevel: FieldLevel
	setFieldLevel: (level: FieldLevel) => void
	defaultPersonnel: Personnel
	setDefaultPersonnel: (personnel: Personnel) => void
	autoMirrorRoutes: boolean
	setAutoMirrorRoutes: (enabled: boolean) => void

	// Playbook Manager context
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	cardsPerRow: number
	setCardsPerRow: (count: number) => void
	showPlayCount: boolean
	setShowPlayCount: (show: boolean) => void
	confirmBeforeDelete: boolean
	setConfirmBeforeDelete: (confirm: boolean) => void
	autoSaveInterval: AutoSaveInterval
	setAutoSaveInterval: (interval: AutoSaveInterval) => void
	sidebarWidth: number
	setSidebarWidth: (width: number) => void

	// Play Editor context
	moveSkillsOnHashChange: boolean
	setMoveSkillsOnHashChange: (move: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function getStoredValue<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return defaultValue
	try {
		const stored = localStorage.getItem(key)
		return stored ? (JSON.parse(stored) as T) : defaultValue
	} catch {
		return defaultValue
	}
}

function storeValue<T>(key: string, value: T): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(key, JSON.stringify(value))
		} catch {
			// Silently fail if localStorage is not available
		}
	}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
	// Global settings
	const [theme, setThemeState] = useState<Theme>(() =>
		getStoredValue('playsmith-theme', 'light')
	)
	const [positionNaming, setPositionNamingState] = useState<PositionNaming>(() =>
		getStoredValue('playsmith-position-naming', 'traditional')
	)
	const [fieldLevel, setFieldLevelState] = useState<FieldLevel>(() =>
		getStoredValue('playsmith-competition-level', 'college')
	)
	const [defaultPersonnel, setDefaultPersonnelState] = useState<Personnel>(() =>
		getStoredValue('playsmith-default-personnel', '11')
	)
	const [autoMirrorRoutes, setAutoMirrorRoutesState] = useState<boolean>(() =>
		getStoredValue('playsmith-auto-mirror', false)
	)

	// Playbook Manager settings
	const [viewMode, setViewModeState] = useState<ViewMode>(() =>
		getStoredValue('playsmith-view-mode', 'grid')
	)
	const [cardsPerRow, setCardsPerRowState] = useState<number>(() =>
		getStoredValue('playsmith-cards-per-row', 4)
	)
	const [showPlayCount, setShowPlayCountState] = useState<boolean>(() =>
		getStoredValue('playsmith-show-play-count', true)
	)
	const [confirmBeforeDelete, setConfirmBeforeDeleteState] = useState<boolean>(() =>
		getStoredValue('playsmith-confirm-delete', true)
	)
	const [autoSaveInterval, setAutoSaveIntervalState] = useState<AutoSaveInterval>(() =>
		getStoredValue('playsmith-auto-save', '30')
	)
	const [sidebarWidth, setSidebarWidthState] = useState<number>(() => {
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return DEFAULT_SIDEBAR_WIDTH
		}
		try {
			const stored = localStorage.getItem('playsmith-sidebar-width')
			if (stored !== null) {
				const width = Number(stored)
				return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
			}
		} catch {
			// Fall through to default
		}
		return DEFAULT_SIDEBAR_WIDTH
	})

	// Play Editor settings
	const [moveSkillsOnHashChange, setMoveSkillsOnHashChangeState] = useState<boolean>(() =>
		getStoredValue('playsmith-move-skills-hash', true)
	)

	// Setter functions with persistence
	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		storeValue('playsmith-theme', newTheme)
	}

	const setPositionNaming = (naming: PositionNaming) => {
		setPositionNamingState(naming)
		storeValue('playsmith-position-naming', naming)
	}

	const setFieldLevel = (level: FieldLevel) => {
		setFieldLevelState(level)
		storeValue('playsmith-competition-level', level)
	}

	const setDefaultPersonnel = (personnel: Personnel) => {
		setDefaultPersonnelState(personnel)
		storeValue('playsmith-default-personnel', personnel)
	}

	const setAutoMirrorRoutes = (enabled: boolean) => {
		setAutoMirrorRoutesState(enabled)
		storeValue('playsmith-auto-mirror', enabled)
	}

	const setViewMode = (mode: ViewMode) => {
		setViewModeState(mode)
		storeValue('playsmith-view-mode', mode)
	}

	const setCardsPerRow = (count: number) => {
		setCardsPerRowState(count)
		storeValue('playsmith-cards-per-row', count)
	}

	const setShowPlayCount = (show: boolean) => {
		setShowPlayCountState(show)
		storeValue('playsmith-show-play-count', show)
	}

	const setConfirmBeforeDelete = (confirm: boolean) => {
		setConfirmBeforeDeleteState(confirm)
		storeValue('playsmith-confirm-delete', confirm)
	}

	const setAutoSaveInterval = (interval: AutoSaveInterval) => {
		setAutoSaveIntervalState(interval)
		storeValue('playsmith-auto-save', interval)
	}

	const setSidebarWidth = (width: number) => {
		const constrainedWidth = Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
		setSidebarWidthState(constrainedWidth)
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem('playsmith-sidebar-width', String(constrainedWidth))
			} catch {
				// Silently fail if localStorage is not available
			}
		}
	}

	const setMoveSkillsOnHashChange = (move: boolean) => {
		setMoveSkillsOnHashChangeState(move)
		storeValue('playsmith-move-skills-hash', move)
	}

	// Apply theme to document
	useEffect(() => {
		const effectiveTheme = theme === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
			: theme

		if (effectiveTheme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [theme])

	return (
		<SettingsContext.Provider
			value={{
				theme,
				setTheme,
				positionNaming,
				setPositionNaming,
				fieldLevel,
				setFieldLevel,
				defaultPersonnel,
				setDefaultPersonnel,
				autoMirrorRoutes,
				setAutoMirrorRoutes,
				viewMode,
				setViewMode,
				cardsPerRow,
				setCardsPerRow,
				showPlayCount,
				setShowPlayCount,
				confirmBeforeDelete,
				setConfirmBeforeDelete,
				autoSaveInterval,
				setAutoSaveInterval,
				sidebarWidth,
				setSidebarWidth,
				moveSkillsOnHashChange,
				setMoveSkillsOnHashChange
			}}
		>
			{children}
		</SettingsContext.Provider>
	)
}

export function useSettings() {
	const context = useContext(SettingsContext)
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider')
	}
	return context
}

// Backward-compatible hook for existing code
export function useTheme() {
	const { theme, setTheme, positionNaming, setPositionNaming, fieldLevel, setFieldLevel } = useSettings()

	// Calculate effective theme (convert 'system' to actual theme)
	const effectiveTheme: 'light' | 'dark' = theme === 'system'
		? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		: theme

	return {
		theme: effectiveTheme,
		setTheme,
		positionNaming,
		setPositionNaming,
		fieldLevel,
		setFieldLevel
	}
}
