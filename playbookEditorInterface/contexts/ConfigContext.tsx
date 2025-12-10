import { createContext, useContext, useState, ReactNode } from 'react'

interface ConfigContextType {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  positionNaming: string
  setPositionNaming: (naming: string) => void
  fieldLevel: string
  setFieldLevel: (level: string) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const DEFAULT_THEME = 'light'
const DEFAULT_POSITION_NAMING = 'XYZABQ'
const DEFAULT_FIELD_LEVEL = 'College'

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(DEFAULT_THEME)
  const [positionNaming, setPositionNaming] = useState(DEFAULT_POSITION_NAMING)
  const [fieldLevel, setFieldLevel] = useState(DEFAULT_FIELD_LEVEL)

  return (
    <ConfigContext.Provider
      value={{
        theme,
        setTheme,
        positionNaming,
        setPositionNaming,
        fieldLevel,
        setFieldLevel,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context == undefined) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
