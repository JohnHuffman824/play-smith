import React from 'react'
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
import {
  PLAY_TYPE_PASS,
} from './constants/playbook'
import { formatDateDayMonthYear } from '@/utils/date.utils'
import { PlayThumbnailSVG } from './PlayThumbnailSVG'
import type { Drawing } from '@/types/drawing.types'
import { createDefaultLinemen } from '@/utils/lineman.utils'
import './play-card.css'

export interface Player {
  id: string
  x: number
  y: number
  label: string
  color: string
  isLineman?: boolean
}

type PlayCardProps = {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  lastModified: string
  thumbnail?: string
  drawings?: Drawing[]
  players?: Player[]
  personnel?: string
  tags?: string[]
  tagObjects?: { id: number; name: string; color: string }[]
  selected?: boolean
  onSelect?: (id: string) => void
  onOpen: (id: string) => void
  onAnimate?: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

type PlayCardThumbnailProps = {
  thumbnail?: string
  drawings?: Drawing[]
  players?: Player[]
  name: string
  playType: string
  onOpen: () => void
  onAnimate?: () => void
}

function PlayCardThumbnail({
  thumbnail,
  drawings,
  players,
  name,
  playType,
  onOpen,
  onAnimate
}: PlayCardThumbnailProps) {
  const badgeClass = playType == PLAY_TYPE_PASS
    ? 'play-card-type-badge-pass'
    : 'play-card-type-badge-run'

  // Use default linemen if no players provided
  const defaultLinemen = createDefaultLinemen('middle')
  const displayPlayers = (players && players.length > 0) ? players : defaultLinemen

  return (
    <div className="play-card-thumbnail">
      <div
        onClick={onOpen}
        className="play-card-thumbnail-button"
      >
        <PlayThumbnailSVG
          drawings={drawings || []}
          players={displayPlayers}
          className="play-card-icon-full"
        />
      </div>

      {playType && (
        <span className={`play-card-type-badge ${badgeClass}`}>
          {playType}
        </span>
      )}

      {onAnimate && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAnimate()
          }}
          className="play-card-animate-button"
          aria-label="Animate play"
        >
          <Play className="play-card-icon-large play-card-icon-white" />
        </button>
      )}
    </div>
  )
}


export function PlayCard({
  id,
  name,
  formation,
  playType,
  defensiveFormation,
  lastModified,
  thumbnail,
  drawings,
  players,
  personnel,
  tags,
  tagObjects,
  selected = false,
  onSelect,
  onOpen,
  onAnimate,
  onRename,
  onDelete,
  onDuplicate,
}: PlayCardProps) {
  return (
    <div className={`play-card ${selected ? 'play-card-selected' : ''}`.trim()}>
      <PlayCardThumbnail
        thumbnail={thumbnail}
        drawings={drawings}
        players={players}
        name={name}
        playType={playType}
        onOpen={() => onOpen(id)}
        onAnimate={onAnimate ? () => onAnimate(id) : undefined}
      />

      {onSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect(id)
          }}
          className="play-card-select-button"
        >
          {selected ? (
            <CheckCircle2 className="play-card-icon-large play-card-icon-primary" />
          ) : (
            <Circle className="play-card-icon-large play-card-icon-muted play-card-select-icon-hidden" />
          )}
        </button>
      )}

      <div className="play-card-content">
        <div className="play-card-header">
          <h3 className="play-card-title">{name}</h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="play-card-menu-button">
                <MoreVertical className="play-card-icon" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onAnimate && (
                <DropdownMenuItem onClick={() => onAnimate(id)}>
                  <Play className="play-card-icon" />
                  Animate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRename(id)}>
                <Edit className="play-card-icon" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(id)}>
                <Copy className="play-card-icon" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(id)} variant="destructive">
                <Trash2 className="play-card-icon" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="play-card-meta">
          {formation && (
            <span className="play-card-formation">
              {formation}
            </span>
          )}
          {personnel && (
            <>
              <span className="play-card-separator">•</span>
              <span className="play-card-personnel">
                {personnel}
              </span>
            </>
          )}
        </div>

        {defensiveFormation && (
          <p className="play-card-defensive-formation">
            vs {defensiveFormation}
          </p>
        )}

        <div className="play-card-tags">
          {tagObjects?.map((tag) => (
            <span
              key={tag.id}
              className="play-card-tag"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: `${tag.color}40`
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
