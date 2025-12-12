import { useState, useEffect, useMemo } from 'react'
import { PlaybookEditorToolbar } from './PlaybookEditorToolbar'
import { PlayCard } from './PlayCard'
import { PlayListView } from './PlayListView'
import { Modal } from '@/components/shared/Modal'
import { Input } from '../ui/input'
import { SearchInput } from '../ui/search-input'
import { UnifiedSettingsDialog } from '@/components/shared/UnifiedSettingsDialog'
import { ShareDialog } from '@/components/shared/ShareDialog'
import { AnimationDialog } from '@/components/animation/AnimationDialog'
import { CallSheetExportDialog } from '@/components/export/CallSheetExportDialog'
import { useTheme } from '@/contexts/SettingsContext'
import { usePlaybookData } from '@/hooks/usePlaybookData'
import { useConceptData } from '@/hooks/useConceptData'
import { ConceptCard } from './ConceptCard'
import type { ConceptFilter } from './ConceptsToolbar'
import { ConceptDialog } from '@/components/concepts/ConceptDialog'
import type { BaseConcept } from '@/types/concept.types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ConceptType = 'concept' | 'formation' | 'group'

type ConceptItem = {
	id: number
	name: string
	type: ConceptType
	thumbnail: string | null
	description: string | null
	isMotion?: boolean
	isModifier?: boolean
	updatedAt: string
}

type ConceptToDelete = {
	id: number
	type: ConceptType
}

// Button style constants
const BUTTON_ACTIVE =
	'bg-action-button text-action-button-foreground hover:bg-action-button/90'
const BUTTON_INACTIVE = 'border border-border hover:bg-accent'

// Concept filters
const CONCEPT_FILTERS = [
	{ id: 'all' as const, label: 'All' },
	{ id: 'routes' as const, label: 'Routes' },
	{ id: 'motions' as const, label: 'Motions' },
	{ id: 'modifiers' as const, label: 'Modifiers' },
	{ id: 'formations' as const, label: 'Formations' },
	{ id: 'groups' as const, label: 'Groups' },
]

import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Settings,
  Upload,
  Download,
  Share2,
  Plus,
  FolderPlus,
} from 'lucide-react'
import {
  PLAY_TYPE_PASS,
  VIEW_MODE_GRID,
  VIEW_MODE_LIST,
  DEFAULT_PLAYBOOK_NAME,
  BUTTON_BASE,
  MODAL_BUTTON_BASE,
  PRIMARY_BUTTON_BASE,
} from './constants/playbook'
import type { Play, Section } from './types'

interface PlaybookEditorProps {
  playbookId?: string
  playbookName?: string
  teamId?: string
  teamName?: string
  onBack?: () => void
  onOpenPlay?: (playId: string) => void
  onImport?: () => void
  onExport?: (selectedPlayIds?: string[]) => void
}

const DARK_MODE_CLASS = 'dark'
const LOCALE_OPTIONS = {
  month: 'short' as const,
  day: 'numeric' as const,
  year: 'numeric' as const,
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', LOCALE_OPTIONS)
}

function PlaybookEditorContent({
  playbookId,
  playbookName = DEFAULT_PLAYBOOK_NAME,
  teamId,
  teamName,
  onBack,
  onOpenPlay,
  onImport,
  onExport
}: PlaybookEditorProps) {
  const {
    theme,
    setTheme,
    positionNaming,
    setPositionNaming,
    fieldLevel,
    setFieldLevel
  } = useTheme()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(VIEW_MODE_GRID)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPlayModal, setShowNewPlayModal] = useState(false)
  const [showNewSectionModal, setShowNewSectionModal] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [renamePlayId, setRenamePlayId] = useState<string | null>(null)
  const [renamePlayName, setRenamePlayName] = useState('')
  const [deletePlayId, setDeletePlayId] = useState<string | null>(null)
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set())
  const [activeSectionFilter, setActiveSectionFilter] = useState<string | null>(null)
  const [showPlayViewer, setShowPlayViewer] = useState(false)
  const [viewingPlayId, setViewingPlayId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Concepts tab state
  const [activeTab, setActiveTab] = useState<'plays' | 'concepts'>('plays')
  const [conceptFilter, setConceptFilter] = useState<ConceptFilter>('all')
  const [showConceptDialog, setShowConceptDialog] = useState(false)
  const [editingConcept, setEditingConcept] = useState<BaseConcept | null>(null)
  const [showDeleteConceptModal, setShowDeleteConceptModal] = useState(false)
  const [conceptToDelete, setConceptToDelete] =
    useState<ConceptToDelete | null>(null)

  const {
    sections,
    isLoading: isLoadingData,
    error: dataError,
    createPlay,
    updatePlay,
    deletePlay,
    duplicatePlay,
    createSection,
    updateSection,
    deleteSection
  } = usePlaybookData(playbookId)

  // Fetch concept data
  const {
    concepts,
    formations,
    conceptGroups,
    isLoading: conceptsLoading,
    createConcept,
    updateConcept,
    deleteConcept,
    deleteFormation,
    deleteConceptGroup,
  } = useConceptData(teamId ?? '', playbookId)

  useEffect(() => {
    if (theme == DARK_MODE_CLASS) {
      document.documentElement.classList.add(DARK_MODE_CLASS)
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS)
    }
  }, [theme])

  // Concept filtering (must be before early returns to follow Rules of Hooks)
  const filteredConcepts = useMemo(() => {
    let items: ConceptItem[] = []

    // Formations
    if (conceptFilter === 'all' || conceptFilter === 'formations') {
      items.push(
        ...formations.map(f => ({
          id: f.id,
          name: f.name,
          type: 'formation' as const,
          thumbnail: f.thumbnail,
          description: f.description,
          updatedAt: new Date(f.updated_at).toLocaleDateString(),
        }))
      )
    }

    // Concepts (routes, motions, modifiers)
    if (conceptFilter !== 'formations' && conceptFilter !== 'groups') {
      const conceptItems = concepts
        .filter(c => {
          if (conceptFilter === 'all') return true
          if (conceptFilter === 'routes') {
            return !c.is_motion && !c.is_modifier
          }
          if (conceptFilter === 'motions') return c.is_motion
          if (conceptFilter === 'modifiers') return c.is_modifier
          return false
        })
        .map(c => ({
          id: c.id,
          name: c.name,
          type: 'concept' as const,
          thumbnail: c.thumbnail,
          description: c.description,
          isMotion: c.is_motion,
          isModifier: c.is_modifier,
          updatedAt: new Date(c.updated_at).toLocaleDateString(),
        }))
      items.push(...conceptItems)
    }

    // Groups
    if (conceptFilter === 'all' || conceptFilter === 'groups') {
      items.push(
        ...conceptGroups.map(g => ({
          id: g.id,
          name: g.name,
          type: 'group' as const,
          thumbnail: g.thumbnail,
          description: g.description,
          updatedAt: new Date(g.updated_at).toLocaleDateString(),
        }))
      )
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      )
    }

    return items
  }, [concepts, formations, conceptGroups, conceptFilter, searchQuery])

  // Show loading state
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playbook...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (dataError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{dataError}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Back to Playbooks
          </button>
        </div>
      </div>
    )
  }

  const allPlays = sections.flatMap((section) =>
    section.plays.map((play) => ({ ...play, sectionId: section.id }))
  )

  const filteredSections = sections.map((section) => ({
    ...section,
    plays: section.plays.filter(
      (play) =>
        play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.formation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.tags.some((tag) => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ),
  })).filter((section) => section.plays.length > 0)

  const displayedSections = activeSectionFilter
    ? filteredSections.filter((section) => section.id == activeSectionFilter)
    : filteredSections

  // Concept handlers
  const handleEditConcept = (id: number, type: ConceptType) => {
    if (type === 'concept') {
      const concept = concepts.find(c => c.id === id)
      if (concept) {
        setEditingConcept(concept)
        setShowConceptDialog(true)
      }
    }
    // TODO: Formation/group editing in future
  }

  const handleDeleteConcept = (id: number, type: ConceptType) => {
    setConceptToDelete({ id, type })
    setShowDeleteConceptModal(true)
  }

  const confirmDeleteConcept = async () => {
    if (!conceptToDelete) return
    const { id, type } = conceptToDelete
    if (type === 'concept') await deleteConcept(id)
    else if (type === 'formation') await deleteFormation(id)
    else if (type === 'group') await deleteConceptGroup(id)
    setShowDeleteConceptModal(false)
    setConceptToDelete(null)
  }

  const handleDuplicateConcept = async (id: number, type: ConceptType) => {
    // TODO: Implement duplication
  }

  const handleSaveConcept = async (data: Partial<BaseConcept>) => {
    if (editingConcept) {
      await updateConcept(editingConcept.id, data)
    } else {
      await createConcept(data)
    }
    setShowConceptDialog(false)
    setEditingConcept(null)
  }

  async function handleNewPlay() {
    if (!newItemName.trim()) return

    try {
      const sectionId = sections.length > 0 ? sections[0].id : null
      const newPlay = await createPlay(newItemName, sectionId)

      setNewItemName('')
      setShowNewPlayModal(false)

      if (onOpenPlay) {
        onOpenPlay(newPlay.id)
      }
    } catch (err) {
      console.error('Failed to create play:', err)
      alert(err instanceof Error ? err.message : 'Failed to create play')
    }
  }

  async function handleNewSection() {
    if (!newItemName.trim()) return

    try {
      await createSection(newItemName)
      setNewItemName('')
      setShowNewSectionModal(false)
    } catch (err) {
      console.error('Failed to create section:', err)
      alert(err instanceof Error ? err.message : 'Failed to create section')
    }
  }

  function handleOpenPlay(playId: string) {
    if (onOpenPlay) {
      onOpenPlay(playId)
    }
  }

  function handleAnimatePlay(playId: string) {
    setViewingPlayId(playId)
    setShowPlayViewer(true)
  }

  function handleClosePlayViewer() {
    setShowPlayViewer(false)
    setViewingPlayId(null)
  }

  function handleRenamePlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (!play) return

    setRenamePlayId(playId)
    setRenamePlayName(play.name)
    setShowRenameModal(true)
  }

  async function confirmRename() {
    if (!renamePlayId || !renamePlayName.trim()) return

    try {
      await updatePlay(renamePlayId, { name: renamePlayName })
      setShowRenameModal(false)
      setRenamePlayId(null)
      setRenamePlayName('')
    } catch (err) {
      console.error('Failed to rename play:', err)
      alert(err instanceof Error ? err.message : 'Failed to rename play')
    }
  }

  function handleDeletePlay(playId: string) {
    setDeletePlayId(playId)
    setShowDeleteConfirmModal(true)
  }

  async function confirmDelete() {
    if (!deletePlayId) return

    try {
      await deletePlay(deletePlayId)
      setShowDeleteConfirmModal(false)
      setDeletePlayId(null)
    } catch (err) {
      console.error('Failed to delete play:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete play')
    }
  }

  async function handleDuplicatePlay(playId: string) {
    try {
      await duplicatePlay(playId)
    } catch (err) {
      console.error('Failed to duplicate play:', err)
      alert(err instanceof Error ? err.message : 'Failed to duplicate play')
    }
  }

  function handleImport() {
    if (onImport) {
      onImport()
    }
  }

  function handleExport() {
    setShowExportDialog(true)
  }

  function handleShare(
    recipients: Array<{ email: string; role: 'viewer' | 'collaborator' }>
  ) {
  }

  function togglePlaySelection(playId: string) {
    const newSelection = new Set(selectedPlays)
    if (newSelection.has(playId)) {
      newSelection.delete(playId)
    } else {
      newSelection.add(playId)
    }
    setSelectedPlays(newSelection)
  }

  function closeNewPlayModal() {
    setShowNewPlayModal(false)
    setNewItemName('')
  }

  function closeNewSectionModal() {
    setShowNewSectionModal(false)
    setNewItemName('')
  }

  function closeRenameModal() {
    setShowRenameModal(false)
    setRenamePlayId(null)
    setRenamePlayName('')
  }

  function closeDeleteConfirmModal() {
    setShowDeleteConfirmModal(false)
    setDeletePlayId(null)
  }

  const totalPlays = allPlays.length
  const exportTitle = selectedPlays.size > 0 
    ? `Export ${selectedPlays.size} selected` 
    : 'Export All'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={`${BUTTON_BASE} cursor-pointer`}
                title="Back to Playbooks"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <h1>{playbookName}</h1>
                  {teamName && (
                    <span className="text-sm text-muted-foreground">
                      {teamName}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-px self-stretch bg-border ml-2" />

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search plays, formations, tags..."
                className="min-w-[400px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className={`${BUTTON_BASE} cursor-pointer`}
                title="Import Plays"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className={`${BUTTON_BASE} cursor-pointer`}
                title={exportTitle}
              >
                <Download className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-border" />

              <button
                onClick={() => setShowShareDialog(true)}
                className={`${BUTTON_BASE} cursor-pointer`}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode(VIEW_MODE_GRID)}
                  className={`p-2 rounded transition-all duration-200 cursor-pointer ${
                    viewMode == VIEW_MODE_GRID
                      ? 'bg-card shadow-sm'
                      : 'hover:bg-accent/50'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODE_LIST)}
                  className={`p-2 rounded transition-all duration-200 cursor-pointer ${
                    viewMode == VIEW_MODE_LIST
                      ? 'bg-card shadow-sm'
                      : 'hover:bg-accent/50'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-border" />

              <button
                onClick={() => setShowSettingsDialog(true)}
                className={`${BUTTON_BASE} cursor-pointer`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Combined Tab Bar and Toolbar */}
        <div className="border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex gap-1">
              {(['plays', 'concepts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium
                    transition-colors capitalize rounded-lg ${
                      activeTab === tab
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Conditional Toolbar Content */}
            {activeTab === 'plays' ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewPlayModal(true)}
                    className={`${BUTTON_BASE} ${BUTTON_ACTIVE}
                      flex items-center gap-2 cursor-pointer`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Play</span>
                  </button>

                  <button
                    onClick={() => setShowNewSectionModal(true)}
                    className={`${BUTTON_BASE} ${BUTTON_INACTIVE}
                      flex items-center gap-2 cursor-pointer`}
                    title="Create New Section"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>New Section</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-border" />

                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setActiveSectionFilter(null)}
                    className={`${BUTTON_BASE} ${
                      activeSectionFilter == null
                        ? BUTTON_ACTIVE
                        : BUTTON_INACTIVE
                    } cursor-pointer`}
                  >
                    All Plays
                  </button>

                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionFilter(section.id)}
                      className={`${BUTTON_BASE} ${
                        activeSectionFilter == section.id
                          ? BUTTON_ACTIVE
                          : BUTTON_INACTIVE
                      } cursor-pointer`}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingConcept(null)
                    setShowConceptDialog(true)
                  }}
                  className={`${BUTTON_BASE} ${BUTTON_ACTIVE}
                    flex items-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  <span>New Concept</span>
                </button>

                <div className="w-px h-6 bg-border" />

                <div className="flex items-center gap-2 flex-1">
                  {CONCEPT_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setConceptFilter(filter.id)}
                      className={`${BUTTON_BASE}
                        ${conceptFilter === filter.id
                          ? BUTTON_ACTIVE
                          : BUTTON_INACTIVE}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === 'plays' ? (
          <>

            <div className="flex-1 overflow-auto">
              <div className="p-6">
            {displayedSections.length > 0 ? (
              <div className="space-y-8">
                {displayedSections.map((section) => (
                  <div key={section.id}>
                    <div
                      className="flex items-center justify-between mb-4"
                    >
                      {section.section_type === 'ideas' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h2 className="cursor-help">{section.name}</h2>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Ideas & Experiments - plays here are in development. All team members can contribute ideas. These aren't required learning.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <h2>{section.name}</h2>
                      )}
                      <p className="text-muted-foreground">
                        {section.plays.length} play
                        {section.plays.length != 1 ? 's' : ''}
                      </p>
                    </div>

                    {section.plays.length === 0 && section.section_type === 'ideas' ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground text-center">
                          This is a space for play ideas and experiments. Anyone on the team can add their ideas here - they won't be part of the main playbook until a coach promotes them.
                        </p>
                      </div>
                    ) : viewMode == VIEW_MODE_GRID ? (
                      <div 
                        className="grid grid-cols-1 sm:grid-cols-2 
                          lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      >
                        {section.plays.map((play) => (
                          <PlayCard
                            key={play.id}
                            {...play}
                            selected={selectedPlays.has(play.id)}
                            onSelect={() => togglePlaySelection(play.id)}
                            onOpen={handleOpenPlay}
                            onAnimate={handleAnimatePlay}
                            onRename={handleRenamePlay}
                            onDelete={handleDeletePlay}
                            onDuplicate={handleDuplicatePlay}
                          />
                        ))}
                      </div>
                    ) : section.plays.length > 0 ? (
                      <PlayListView
                        plays={section.plays}
                        selectedPlays={selectedPlays}
                        onSelect={togglePlaySelection}
                        onOpen={handleOpenPlay}
                        onAnimate={handleAnimatePlay}
                        onRename={handleRenamePlay}
                        onDelete={handleDeletePlay}
                        onDuplicate={handleDuplicatePlay}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center 
                  justify-center py-16"
              >
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'No plays found matching your search' 
                      : 'No plays in this playbook'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewPlayModal(true)}
                      className={`${PRIMARY_BUTTON_BASE} px-6 py-2.5 cursor-pointer`}
                    >
                      Create Your First Play
                    </button>
                  )}
                </div>
              </div>
            )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
              {conceptsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Loading concepts...</p>
                </div>
              ) : filteredConcepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <p className="text-muted-foreground">No concepts found</p>
                  <button
                    onClick={() => {
                      setEditingConcept(null)
                      setShowConceptDialog(true)
                    }}
                    className="px-4 py-2 bg-action-button
                      text-action-button-foreground rounded-lg
                      hover:bg-action-button/90"
                  >
                    Create your first concept
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredConcepts.map((item) => (
                    <ConceptCard
                      key={`${item.type}-${item.id}`}
                      id={item.id}
                      name={item.name}
                      type={item.type}
                      thumbnail={item.thumbnail}
                      description={item.description}
                      isMotion={item.isMotion}
                      isModifier={item.isModifier}
                      lastModified={item.updatedAt}
                      onEdit={handleEditConcept}
                      onDelete={handleDeleteConcept}
                      onDuplicate={handleDuplicateConcept}
                    />
                  ))}
                </div>
              )}
            </div>
        )}
      </div>

      {/* Concept Dialog */}
      <ConceptDialog
        isOpen={showConceptDialog}
        onClose={() => {
          setShowConceptDialog(false)
          setEditingConcept(null)
        }}
        mode={editingConcept ? 'edit' : 'create'}
        concept={editingConcept ?? undefined}
        teamId={teamId ?? ''}
        playbookId={playbookId}
        onSave={handleSaveConcept}
      />

      {/* Delete Concept Confirmation */}
      <Modal
        isOpen={showDeleteConceptModal}
        onClose={() => setShowDeleteConceptModal(false)}
        title="Delete Concept"
      >
        <p className="text-muted-foreground mb-4">
          Are you sure you want to delete this {conceptToDelete?.type}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConceptModal(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent">
            Cancel
          </button>
          <button onClick={confirmDeleteConcept} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showNewPlayModal}
        onClose={closeNewPlayModal}
        title="Create New Play"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Play Name</label>
            <Input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewPlay()
                }
              }}
              placeholder="Enter play name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeNewPlayModal} className={`${MODAL_BUTTON_BASE} cursor-pointer`}>
              Cancel
            </button>
            <button
              onClick={handleNewPlay}
              disabled={!newItemName.trim()}
              className={`${PRIMARY_BUTTON_BASE}
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNewSectionModal}
        onClose={closeNewSectionModal}
        title="Create New Section"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Section Name</label>
            <Input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewSection()
                }
              }}
              placeholder="Enter section name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeNewSectionModal}
              className={`${MODAL_BUTTON_BASE} cursor-pointer`}
            >
              Cancel
            </button>
            <button
              onClick={handleNewSection}
              disabled={!newItemName.trim()}
              className={`${PRIMARY_BUTTON_BASE}
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <UnifiedSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        context="playbook-editor"
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        playbookName={playbookName}
        onShare={handleShare}
      />

      <CallSheetExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        sections={sections}
        playbookName={playbookName}
        playbookId={playbookId || ''}
      />

      <Modal
        isOpen={showRenameModal}
        onClose={closeRenameModal}
        title="Rename Play"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Play Name</label>
            <Input
              type="text"
              value={renamePlayName}
              onChange={(e) => setRenamePlayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  confirmRename()
                }
              }}
              placeholder="Enter play name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeRenameModal} className={`${MODAL_BUTTON_BASE} cursor-pointer`}>
              Cancel
            </button>
            <button
              onClick={confirmRename}
              disabled={!renamePlayName.trim()}
              className={`${PRIMARY_BUTTON_BASE}
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              Rename
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={closeDeleteConfirmModal}
        title="Delete Play"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this play? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeDeleteConfirmModal}
              className={`${MODAL_BUTTON_BASE} cursor-pointer`}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className={`${PRIMARY_BUTTON_BASE} bg-destructive
                hover:bg-destructive/90 cursor-pointer`}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Play Animation Dialog */}
      <AnimationDialog
        isOpen={showPlayViewer}
        onClose={handleClosePlayViewer}
        playId={viewingPlayId}
        playName={allPlays.find(p => p.id === viewingPlayId)?.name}
      />
    </div>
  )
}

export default function PlaybookEditor(props: PlaybookEditorProps) {
  return <PlaybookEditorContent {...props} />
}
