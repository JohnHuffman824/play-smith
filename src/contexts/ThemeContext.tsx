import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type Theme = 'light' | 'dark'
type PositionNaming = 'traditional' | 'modern' | 'numeric'
type FieldLevel = 'high-school' | 'college' | 'pro'

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
	positionNaming: PositionNaming
	setPositionNaming: (naming: PositionNaming) => void
	fieldLevel: FieldLevel
	setFieldLevel: (level: FieldLevel) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

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

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() =>
		getStoredValue('theme', 'light')
	)
	const [positionNaming, setPositionNamingState] = useState<PositionNaming>(() =>
		getStoredValue('positionNaming', 'traditional')
	)
	const [fieldLevel, setFieldLevelState] = useState<FieldLevel>(() =>
		getStoredValue('fieldLevel', 'college')
	)

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		storeValue('theme', newTheme)
	}

	const setPositionNaming = (naming: PositionNaming) => {
		setPositionNamingState(naming)
		storeValue('positionNaming', naming)
	}

	const setFieldLevel = (level: FieldLevel) => {
		setFieldLevelState(level)
		storeValue('fieldLevel', level)
	}

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [theme])

	return (
		<ThemeContext.Provider
			value={{
				theme,
				setTheme,
				positionNaming,
				setPositionNaming,
				fieldLevel,
				setFieldLevel
			}}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
