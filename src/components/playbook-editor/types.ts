/**
 * Shared types for playbookEditorInterface components
 * These are temporary local types used by the Figma-exported UI
 */

export interface Play {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  tags: string[]
  lastModified: string
  thumbnail?: string
  personnel?: string
}

export interface Section {
  id: string
  name: string
  plays: Play[]
}
