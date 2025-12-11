import { useState, useEffect, useMemo } from 'react'
import { PlaybookEditorToolbar } from './PlaybookEditorToolbar'
import { PlayCard } from './PlayCard'
import { PlayListView } from './PlayListView'
import { Modal } from '@/components/shared/Modal'
import { SettingsDialog } from '@/components/shared/SettingsDialog'
import { ShareDialog } from '@/components/shared/ShareDialog'
import { PlayViewerModal } from '@/components/animation/PlayViewerModal'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { usePlaybookData } from '@/hooks/usePlaybookData'
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Settings,
  Upload,
  Download,
  Share2,
} from 'lucide-react'
import {
  PLAY_TYPE_PASS,
  VIEW_MODE_GRID,
  VIEW_MODE_LIST,
  DEFAULT_PLAYBOOK_NAME,
  BUTTON_BASE,
  INPUT_BASE,
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

  useEffect(() => {
    if (theme == DARK_MODE_CLASS) {
      document.documentElement.classList.add(DARK_MODE_CLASS)
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS)
    }
  }, [theme])

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
    if (onExport) {
      const playIds = selectedPlays.size > 0
        ? Array.from(selectedPlays)
        : undefined
      onExport(playIds)
    }
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

              <div className="relative min-w-[400px]">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 
                    w-5 h-5 text-muted-foreground" 
                />
                <input
                  type="text"
                  placeholder="Search plays, formations, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 
                    bg-input-background text-foreground 
                    placeholder:text-muted-foreground rounded-lg 
                    border-0 outline-none focus:ring-2 
                    focus:ring-ring/20 transition-all duration-200"
                />
              </div>
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

        <PlaybookEditorToolbar
          onNewPlay={() => setShowNewPlayModal(true)}
          onNewSection={() => setShowNewSectionModal(true)}
          sections={sections.map(s => ({ id: s.id, name: s.name }))}
          activeSectionFilter={activeSectionFilter}
          onSectionFilterChange={setActiveSectionFilter}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {displayedSections.length > 0 ? (
              <div className="space-y-8">
                {displayedSections.map((section) => (
                  <div key={section.id}>
                    <div 
                      className="flex items-center justify-between mb-4"
                    >
                      <h2>{section.name}</h2>
                      <p className="text-muted-foreground">
                        {section.plays.length} play
                        {section.plays.length != 1 ? 's' : ''}
                      </p>
                    </div>

                    {viewMode == VIEW_MODE_GRID ? (
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
                    ) : (
                      <PlayListView
                        plays={section.plays}
                        selectedPlays={selectedPlays}
                        onSelect={togglePlaySelection}
                        onOpen={handleOpenPlay}
                        onRename={handleRenamePlay}
                        onDelete={handleDeletePlay}
                        onDuplicate={handleDuplicatePlay}
                      />
                    )}
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
      </div>

      <Modal
        isOpen={showNewPlayModal}
        onClose={closeNewPlayModal}
        title="Create New Play"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Play Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewPlay()
                }
              }}
              placeholder="Enter play name..."
              className={INPUT_BASE}
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
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewSection()
                }
              }}
              placeholder="Enter section name..."
              className={INPUT_BASE}
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

      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        theme={theme}
        onThemeChange={setTheme}
        positionNaming={positionNaming}
        onPositionNamingChange={setPositionNaming}
        fieldLevel={fieldLevel}
        onFieldLevelChange={setFieldLevel}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        playbookName={playbookName}
        onShare={handleShare}
      />

      <Modal
        isOpen={showRenameModal}
        onClose={closeRenameModal}
        title="Rename Play"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Play Name</label>
            <input
              type="text"
              value={renamePlayName}
              onChange={(e) => setRenamePlayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  confirmRename()
                }
              }}
              placeholder="Enter play name..."
              className={INPUT_BASE}
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

      {/* Play Animation Viewer Modal */}
      {showPlayViewer && viewingPlayId && playbookId && (
        <PlayViewerModal
          isOpen={showPlayViewer}
          onClose={handleClosePlayViewer}
          playbookId={playbookId}
          initialPlayId={viewingPlayId}
          plays={allPlays.map(play => ({
            id: play.id,
            name: play.name,
          }))}
          canEdit={true}
        />
      )}
    </div>
  )
}

export default function PlaybookEditor(props: PlaybookEditorProps) {
  return (
    <ThemeProvider>
      <PlaybookEditorContent {...props} />
    </ThemeProvider>
  )
}
