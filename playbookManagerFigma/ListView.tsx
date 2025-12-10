import { BookOpen, Folder, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface ListItem {
  id: string;
  name: string;
  type: 'playbook' | 'folder';
  playCount?: number;
  lastModified: string;
}

interface ListViewProps {
  items: ListItem[];
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function ListView({ items, onOpen, onRename, onDelete, onDuplicate, onExport, onShare }: ListViewProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto,1fr,150px,150px,60px] gap-4 px-6 py-3 border-b border-border bg-muted/30">
        <div className="w-10" />
        <div className="text-muted-foreground">Name</div>
        <div className="text-muted-foreground">Type</div>
        <div className="text-muted-foreground">Last Modified</div>
        <div className="w-10" />
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[auto,1fr,150px,150px,60px] gap-4 px-6 py-4 hover:bg-accent/50 cursor-pointer transition-colors duration-150 group"
            onClick={() => onOpen(item.id)}
          >
            {/* Icon */}
            <div className="w-10 flex items-center justify-center">
              {item.type === 'folder' ? (
                <Folder className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>

            {/* Name */}
            <div className="flex items-center">
              <span className="truncate">{item.name}</span>
            </div>

            {/* Type/Count */}
            <div className="flex items-center text-muted-foreground">
              {item.type === 'folder'
                ? 'Folder'
                : `${item.playCount || 0} play${item.playCount !== 1 ? 's' : ''}`}
            </div>

            {/* Last Modified */}
            <div className="flex items-center text-muted-foreground">
              {item.lastModified}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center relative">
              <button
                className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === item.id ? null : item.id);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Context Menu */}
              {activeMenu === item.id && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(null);
                    }}
                  />
                  <div className="absolute top-8 right-0 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-30">
                    <button
                      className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(item.id);
                        setActiveMenu(null);
                      }}
                    >
                      Open
                    </button>
                    <button
                      className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(item.id);
                        setActiveMenu(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(item.id);
                        setActiveMenu(null);
                      }}
                    >
                      Duplicate
                    </button>
                    {onExport && (
                      <button
                        className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExport(item.id);
                          setActiveMenu(null);
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
                          onShare(item.id);
                          setActiveMenu(null);
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
                        onDelete(item.id);
                        setActiveMenu(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}