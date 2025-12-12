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
  PLAY_TYPE_BADGE_PASS,
  PLAY_TYPE_BADGE_RUN,
} from './constants/playbook'
import { formatDateDayMonthYear } from '@/utils/date.utils'
import { PlayThumbnailSVG } from './PlayThumbnailSVG'
import type { Drawing } from '@/types/drawing.types'
import { createDefaultLinemen } from '@/utils/lineman.utils'

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
    ? PLAY_TYPE_BADGE_PASS
    : PLAY_TYPE_BADGE_RUN

  // Use default linemen if no players provided
  const defaultLinemen = createDefaultLinemen('middle')
  const displayPlayers = (players && players.length > 0) ? players : defaultLinemen

  return (
    <div className="relative group/thumbnail">
      <div
        onClick={onOpen}
        className="aspect-video bg-muted flex items-center
          justify-center cursor-pointer hover:bg-accent
          transition-colors duration-200"
      >
        <PlayThumbnailSVG
          drawings={drawings || []}
          players={displayPlayers}
          className="w-full h-full"
        />
      </div>

      {playType && (
        <div className="absolute top-2 right-2">
          <span
            className={`px-2.5 py-1 rounded-md text-xs shadow-sm
              backdrop-blur-sm ${badgeClass}`}
          >
            {playType}
          </span>
        </div>
      )}

      {onAnimate && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAnimate()
          }}
          className="absolute left-1/2 top-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2
            items-center justify-center rounded-full bg-white shadow-lg
            opacity-0 transition-all duration-200
            group-hover/thumbnail:opacity-100 hover:scale-110"
          aria-label="Animate play"
        >
          <Play className="size-5 fill-black text-black" />
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
  selected = false,
  onSelect,
  onOpen,
  onAnimate,
  onRename,
  onDelete,
  onDuplicate,
}: PlayCardProps) {
  const cardClass = `group relative bg-card border border-border
    rounded-xl overflow-hidden hover:ring-4 hover:ring-blue-500/50
    hover:border-blue-500
    transition-all duration-200 ${
      selected ? 'ring-2 ring-primary' : ''
    }`

  return (
    <div className={cardClass}>
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
          className="absolute top-2 left-2 p-1 bg-background/80
            backdrop-blur-sm rounded-full hover:bg-background
            transition-all duration-200"
        >
          {selected ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle
              className="w-5 h-5 text-muted-foreground opacity-0
                group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="flex-1 line-clamp-1">{name}</h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 hover:bg-accent rounded
                  transition-all duration-200 opacity-0
                  group-hover:opacity-100 cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(id)}>
                <Edit className="w-4 h-4" />
                Open
              </DropdownMenuItem>
              {onAnimate && (
                <DropdownMenuItem onClick={() => onAnimate(id)}>
                  <Play className="w-4 h-4" />
                  Animate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRename(id)}>
                <Edit className="w-4 h-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(id)}>
                <Copy className="w-4 h-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(id)} variant="destructive">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {formation && (
            <span className="text-muted-foreground">
              {formation}
            </span>
          )}
          {personnel && (
            <>
              <span className="text-muted-foreground">•</span>
              <span 
                className="px-2 py-0.5 bg-muted rounded 
                  text-muted-foreground text-xs"
              >
                {personnel}
              </span>
            </>
          )}
        </div>

        {defensiveFormation && (
          <p className="text-muted-foreground mb-3">
            vs {defensiveFormation}
          </p>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-muted-foreground">{formatDateDayMonthYear(lastModified)}</p>
        </div>
      </div>
    </div>
  )
}
