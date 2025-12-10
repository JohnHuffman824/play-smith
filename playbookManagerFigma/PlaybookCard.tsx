import { BookOpen, MoreVertical, Folder, Download, Share2 } from 'lucide-react';
import { useState } from 'react';

interface PlaybookCardProps {
  id: string;
  name: string;
  type: 'playbook' | 'folder';
  playCount?: number;
  lastModified: string;
  thumbnail?: string;
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function PlaybookCard({
  id,
  name,
  type,
  playCount = 0,
  lastModified,
  thumbnail,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
  onExport,
  onShare,
}: PlaybookCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="group relative bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onOpen(id)}
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
        ) : type === 'folder' ? (
          <Folder className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent to-muted flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
        )}
        
        {/* Action Buttons - Only show for playbooks */}
        {type === 'playbook' && (
          <>
            {onShare && (
              <button
                className="absolute top-2 right-20 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(id);
                }}
                title="Share Playbook"
              >
                <Share2 className="w-4 h-4 text-foreground" />
              </button>
            )}
            {onExport && (
              <button
                className="absolute top-2 right-11 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(id);
                }}
                title="Export Playbook"
              >
                <Download className="w-4 h-4 text-foreground" />
              </button>
            )}
          </>
        )}

        {/* More Options Button */}
        <button
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="w-4 h-4 text-foreground" />
        </button>

        {/* Context Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute top-11 right-2 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-30">
              <button
                className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(id);
                  setShowMenu(false);
                }}
              >
                Open
              </button>
              <button
                className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(id);
                  setShowMenu(false);
                }}
              >
                Rename
              </button>
              <button
                className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(id);
                  setShowMenu(false);
                }}
              >
                Duplicate
              </button>
              {onExport && (
                <button
                  className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(id);
                    setShowMenu(false);
                  }}
                >
                  Export
                </button>
              )}
              {onShare && (
                <button
                  className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(id);
                    setShowMenu(false);
                  }}
                >
                  Share
                </button>
              )}
              <div className="h-px bg-border my-1" />
              <button
                className="w-full px-4 py-2 hover:bg-accent text-destructive transition-colors duration-150 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                  setShowMenu(false);
                }}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4">
        <h3 className="truncate mb-1">{name}</h3>
        <p className="text-muted-foreground">
          {type === 'folder' ? 'Folder' : `${playCount} play${playCount !== 1 ? 's' : ''}`}
        </p>
        <p className="text-muted-foreground mt-1">
          {lastModified}
        </p>
      </div>
    </div>
  );
}