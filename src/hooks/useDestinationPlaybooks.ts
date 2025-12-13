import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface PlaybookSection {
  id: string
  name: string
  section_type: 'standard' | 'ideas'
}

interface PlaybookWithSections {
  id: string
  name: string
  teamName: string | null
  sections: PlaybookSection[]
}

export function useDestinationPlaybooks(currentPlaybookId: string) {
  const navigate = useNavigate()
  const [playbooks, setPlaybooks] = useState<PlaybookWithSections[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionsCache, setSectionsCache] = useState<Record<string, PlaybookSection[]>>({})

  useEffect(() => {
    async function fetchPlaybooks() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/playbooks')
        if (response.status === 401) {
          navigate('/login')
          return
        }
        if (!response.ok) throw new Error('Failed to fetch playbooks')

        const data = await response.json()
        setPlaybooks((data.playbooks || []).map((pb: any) => ({
          id: String(pb.id),
          name: pb.name,
          teamName: pb.team_name || null,
          sections: [],
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlaybooks()
  }, [navigate])

  const fetchSections = useCallback(async (playbookId: string): Promise<PlaybookSection[]> => {
    if (sectionsCache[playbookId]) return sectionsCache[playbookId]

    try {
      const response = await fetch(`/api/playbooks/${playbookId}/sections`)
      if (!response.ok) throw new Error('Failed to fetch sections')

      const data = await response.json()
      const sections: PlaybookSection[] = (data.sections || []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        section_type: s.section_type || 'standard',
      }))

      setSectionsCache(prev => ({ ...prev, [playbookId]: sections }))
      setPlaybooks(prev => prev.map(pb => pb.id === playbookId ? { ...pb, sections } : pb))
      return sections
    } catch (err) {
      console.error('Failed to fetch sections:', err)
      return []
    }
  }, [sectionsCache])

  return { playbooks, isLoading, error, fetchSections }
}
