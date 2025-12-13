import { Plus, FolderPlus } from 'lucide-react'
import './playbook-editor-toolbar.css'

interface Section {
  id: string
  name: string
}

interface PlaybookEditorToolbarProps {
  onNewPlay: () => void
  onNewSection: () => void
  sections: Section[]
  activeSectionFilter: string | null
  onSectionFilterChange: (sectionId: string | null) => void
}

export function PlaybookEditorToolbar({
  onNewPlay,
  onNewSection,
  sections,
  activeSectionFilter,
  onSectionFilterChange,
}: PlaybookEditorToolbarProps) {
  return (
    <div className="playbook-editor-toolbar">
      <div className="playbook-editor-toolbar-content">
        <div className="playbook-editor-toolbar-button-group">
          <button
            onClick={onNewPlay}
            className="playbook-editor-toolbar-button"
            data-active="true"
          >
            <Plus className="w-4 h-4" />
            <span>New Play</span>
          </button>

          <button
            onClick={onNewSection}
            className="playbook-editor-toolbar-button"
            title="Create New Section"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Section</span>
          </button>
        </div>

        <div className="playbook-editor-toolbar-divider" />

        <div className="playbook-editor-toolbar-button-group">
          <button
            onClick={() => onSectionFilterChange(null)}
            className="playbook-editor-toolbar-button"
            data-active={activeSectionFilter == null}
          >
            All Plays
          </button>

          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionFilterChange(section.id)}
              className="playbook-editor-toolbar-button"
              data-active={activeSectionFilter == section.id}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
