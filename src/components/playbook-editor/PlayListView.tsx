import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Play } from './types'
import './play-list-view.css'

type PlayListViewProps = {
  plays: Play[]
  selectedPlays: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onAnimate?: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function PlayListView({
  plays,
  selectedPlays,
  onSelect,
  onOpen,
  onAnimate,
  onRename,
  onDelete,
  onDuplicate,
}: PlayListViewProps) {
  return (
    <div className="play-list-view">
      <div className="play-list-view-header">
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 1' }}>
          <Circle className="w-5 h-5" />
        </div>
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 5' }}>
          Play
        </div>
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 2' }}>
          Formation
        </div>
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 2' }}>
          Tags
        </div>
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 1' }}>
          Modified
        </div>
        <div className="play-list-view-header-cell" style={{ gridColumn: 'span 1' }}></div>
      </div>

      <div className="play-list-view-rows">
        {plays.map((play) => {
          const isSelected = selectedPlays.has(play.id)

          return (
            <div
              key={play.id}
              className={`play-list-view-row ${
                isSelected ? 'play-list-view-row-selected' : ''
              }`}
            >
              <div className="play-list-view-cell" style={{ gridColumn: 'span 1' }}>
                <button
                  onClick={() => onSelect(play.id)}
                  className="play-list-view-select-button"
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="play-list-view-cell" style={{ gridColumn: 'span 5' }}>
                <button
                  onClick={() => onOpen(play.id)}
                  className="play-list-view-name-button"
                >
                  {play.name}
                </button>
              </div>

              <div className="play-list-view-cell" style={{ gridColumn: 'span 2' }}>
                <span className="play-list-view-formation">
                  {play.formation || '-'}
                </span>
              </div>

              <div className="play-list-view-cell" style={{ gridColumn: 'span 2' }}>
                <div className="play-list-view-tags">
                  {play.tags.length > 0 ? (
                    <>
                      <span className="play-list-view-tag">
                        {play.tags[0]}
                      </span>
                      {play.tags.length > 1 && (
                        <span className="play-list-view-tag-count">
                          +{play.tags.length - 1}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="play-list-view-formation">-</span>
                  )}
                </div>
              </div>

              <div className="play-list-view-cell" style={{ gridColumn: 'span 1' }}>
                <span className="play-list-view-modified">
                  {play.lastModified}
                </span>
              </div>

              <div className="play-list-view-cell play-list-view-actions" style={{ gridColumn: 'span 1' }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="play-list-view-menu-button">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onAnimate && (
                      <DropdownMenuItem onClick={() => onAnimate(play.id)}>
                        <Play className="w-4 h-4" />
                        Animate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onRename(play.id)}>
                      <Edit className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(play.id)}>
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(play.id)} variant="destructive">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
