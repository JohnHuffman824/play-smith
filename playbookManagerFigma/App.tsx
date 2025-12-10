import { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PlaybookCard } from './components/PlaybookCard';
import { ListView } from './components/ListView';
import { Modal } from './components/Modal';
import { SettingsDialog } from './components/SettingsDialog';
import { ShareDialog } from './components/ShareDialog';
import { TeamManagement } from './components/TeamManagement';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';

interface Team {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  memberCount: number;
  playbookCount: number;
}

interface Playbook {
  id: string;
  name: string;
  type: 'playbook';
  lastModified: string;
  plays: number;
  sharedBy?: string;
  teamId: string;
}

interface Folder {
  id: string;
  name: string;
  type: 'folder';
  lastModified: string;
  teamId: string;
}

type Item = Playbook | Folder;

function AppContent() {
  const { theme, setTheme, positionNaming, setPositionNaming, fieldLevel, setFieldLevel } = useConfig();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('all');
  const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingPlaybookId, setSharingPlaybookId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState('team1');

  // Mock teams data
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'team1',
      name: 'Varsity Football',
      role: 'owner',
      memberCount: 8,
      playbookCount: 6,
    },
    {
      id: 'team2',
      name: 'JV Squad',
      role: 'editor',
      memberCount: 5,
      playbookCount: 3,
    },
    {
      id: 'team3',
      name: 'Alumni Coaches',
      role: 'viewer',
      memberCount: 12,
      playbookCount: 10,
    },
  ]);

  // Helper to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Mock data
  const [playbooks, setPlaybooks] = useState<Item[]>([
    {
      id: '1',
      name: 'Offensive Game Plan - Week 1',
      type: 'playbook',
      plays: 24,
      lastModified: formatDate(new Date('2024-12-05')),
      teamId: 'team1',
    },
    {
      id: '2',
      name: 'Red Zone Package',
      type: 'playbook',
      plays: 12,
      lastModified: formatDate(new Date('2024-12-03')),
      teamId: 'team1',
    },
    {
      id: '3',
      name: 'Third Down Situations',
      type: 'playbook',
      plays: 18,
      lastModified: formatDate(new Date('2024-12-01')),
      teamId: 'team1',
    },
    {
      id: '4',
      name: 'Two-Minute Drill',
      type: 'playbook',
      plays: 8,
      lastModified: formatDate(new Date('2024-11-28')),
      teamId: 'team1',
    },
    {
      id: '5',
      name: 'Goal Line Offense',
      type: 'playbook',
      plays: 10,
      lastModified: formatDate(new Date('2024-11-25')),
      teamId: 'team1',
    },
    {
      id: '6',
      name: '2024 Season',
      type: 'folder',
      lastModified: formatDate(new Date('2024-12-06')),
      teamId: 'team1',
    },
    {
      id: '7',
      name: 'Spread Offense',
      type: 'folder',
      lastModified: formatDate(new Date('2024-12-02')),
      teamId: 'team1',
    },
    {
      id: '8',
      name: 'Special Teams',
      type: 'playbook',
      plays: 15,
      lastModified: formatDate(new Date('2024-11-22')),
      teamId: 'team1',
    },
    // Shared playbooks
    {
      id: '9',
      name: 'West Coast Offense Fundamentals',
      type: 'playbook',
      plays: 32,
      lastModified: formatDate(new Date('2024-12-04')),
      sharedBy: 'coach.johnson@team.com',
      teamId: 'team1',
    },
    {
      id: '10',
      name: 'Defensive Blitz Packages',
      type: 'playbook',
      plays: 20,
      lastModified: formatDate(new Date('2024-11-30')),
      sharedBy: 'mike.williams@team.com',
      teamId: 'team1',
    },
  ]);

  // Apply dark mode to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Filter playbooks based on search and active section
  let filteredPlaybooks = playbooks.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply section filtering
  if (activeSection === 'shared') {
    filteredPlaybooks = filteredPlaybooks.filter(
      (item) => item.type === 'playbook' && 'sharedBy' in item && item.sharedBy
    );
  } else if (activeSection === 'folders') {
    filteredPlaybooks = filteredPlaybooks.filter((item) => item.type === 'folder');
  } else if (activeSection === 'all') {
    // Show all playbooks and folders except shared ones
    filteredPlaybooks = filteredPlaybooks.filter(
      (item) => item.type === 'folder' || !('sharedBy' in item) || !item.sharedBy
    );
  }

  const handleNewPlaybook = () => {
    if (newItemName.trim()) {
      const newPlaybook: Playbook = {
        id: Date.now().toString(),
        name: newItemName,
        type: 'playbook',
        plays: 0,
        lastModified: formatDate(new Date()),
        teamId: 'team1',
      };
      setPlaybooks([newPlaybook, ...playbooks]);
      setNewItemName('');
      setShowNewPlaybookModal(false);
    }
  };

  const handleNewFolder = () => {
    if (newItemName.trim()) {
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: newItemName,
        type: 'folder',
        lastModified: formatDate(new Date()),
        teamId: 'team1',
      };
      setPlaybooks([newFolder, ...playbooks]);
      setNewItemName('');
      setShowNewFolderModal(false);
    }
  };

  const handleOpen = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item) {
      alert(`Opening ${item.type}: ${item.name}`);
    }
  };

  const handleRename = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item) {
      const newName = prompt(`Rename ${item.type}:`, item.name);
      if (newName && newName.trim()) {
        setPlaybooks(
          playbooks.map((p) =>
            p.id === id ? { ...p, name: newName, lastModified: formatDate(new Date()) } : p
          )
        );
      }
    }
  };

  const handleDelete = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item && confirm(`Delete ${item.name}?`)) {
      setPlaybooks(playbooks.filter((p) => p.id !== id));
    }
  };

  const handleDuplicate = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item) {
      const duplicate: Item = {
        ...item,
        id: Date.now().toString(),
        name: `${item.name} (Copy)`,
        lastModified: formatDate(new Date()),
      };
      setPlaybooks([duplicate, ...playbooks]);
    }
  };

  const handleImport = () => {
    alert('Import functionality - would open file picker');
  };

  const handleExport = () => {
    alert('Export functionality - would download selected playbooks');
  };

  const handleExportPlaybook = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item) {
      alert(`Exporting playbook: ${item.name}`);
    }
  };

  const handleShare = (id: string) => {
    const item = playbooks.find((p) => p.id === id);
    if (item) {
      setSharingPlaybookId(id);
      setShowShareDialog(true);
    }
  };

  const handleShareSubmit = (recipients: { email: string; role: 'viewer' | 'collaborator' }[]) => {
    const item = playbooks.find((p) => p.id === sharingPlaybookId);
    if (item) {
      const roleDetails = recipients.map(r => `${r.email} (${r.role === 'viewer' ? 'Viewer' : 'Collaborator'})`).join('\n');
      alert(`Shared "${item.name}" with ${recipients.length} people:\n\n${roleDetails}`);
    }
  };

  const handleSwitchTeam = (teamId: string) => {
    setCurrentTeamId(teamId);
  };

  const handleCreateTeam = (name: string) => {
    const newTeam: Team = {
      id: `team${Date.now()}`,
      name,
      role: 'owner',
      memberCount: 1,
      playbookCount: 0,
    };
    setTeams([...teams, newTeam]);
  };

  const sharingPlaybook = sharingPlaybookId
    ? playbooks.find((p) => p.id === sharingPlaybookId)
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewPlaybook={() => setShowNewPlaybookModal(true)}
          onNewFolder={() => setShowNewFolderModal(true)}
          onImport={handleImport}
          onExport={handleExport}
          onSettingsClick={() => setShowSettingsDialog(true)}
          teams={teams}
          currentTeamId={currentTeamId}
          onSwitchTeam={handleSwitchTeam}
          onManageTeams={() => setShowTeamManagement(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="p-6">
            {/* Section Header */}
            <div className="mb-6">
              <h1 className="mb-1">
                {activeSection === 'all' && 'All Playbooks'}
                {activeSection === 'folders' && 'Folders'}
                {activeSection === 'starred' && 'Starred'}
                {activeSection === 'recent' && 'Recent'}
                {activeSection === 'trash' && 'Trash'}
                {activeSection === 'shared' && 'Shared'}
              </h1>
              <p className="text-muted-foreground">
                {filteredPlaybooks.length} item{filteredPlaybooks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Grid or List View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlaybooks.map((playbook) => (
                  <PlaybookCard
                    key={playbook.id}
                    {...playbook}
                    onOpen={handleOpen}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onExport={handleExportPlaybook}
                    onShare={handleShare}
                  />
                ))}
              </div>
            ) : (
              <ListView
                items={filteredPlaybooks}
                onOpen={handleOpen}
                onRename={handleRename}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onExport={handleExportPlaybook}
                onShare={handleShare}
              />
            )}

            {/* Empty State */}
            {filteredPlaybooks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No playbooks found</p>
                  <button
                    onClick={() => setShowNewPlaybookModal(true)}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
                  >
                    Create Your First Playbook
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Playbook Modal */}
      <Modal
        isOpen={showNewPlaybookModal}
        onClose={() => {
          setShowNewPlaybookModal(false);
          setNewItemName('');
        }}
        title="Create New Playbook"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Playbook Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNewPlaybook();
                }
              }}
              placeholder="Enter playbook name..."
              className="w-full px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowNewPlaybookModal(false);
                setNewItemName('');
              }}
              className="px-4 py-2 hover:bg-accent rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleNewPlaybook}
              disabled={!newItemName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={showNewFolderModal}
        onClose={() => {
          setShowNewFolderModal(false);
          setNewItemName('');
        }}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Folder Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNewFolder();
                }
              }}
              placeholder="Enter folder name..."
              className="w-full px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowNewFolderModal(false);
                setNewItemName('');
              }}
              className="px-4 py-2 hover:bg-accent rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleNewFolder}
              disabled={!newItemName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        theme={theme}
        onThemeChange={(theme) => setTheme(theme)}
        positionNaming={positionNaming}
        onPositionNamingChange={(positionNaming) => setPositionNaming(positionNaming)}
        fieldLevel={fieldLevel}
        onFieldLevelChange={(fieldLevel) => setFieldLevel(fieldLevel)}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setSharingPlaybookId(null);
        }}
        playbookName={sharingPlaybook?.name || ''}
        onShare={handleShareSubmit}
      />

      {/* Team Management */}
      <TeamManagement
        isOpen={showTeamManagement}
        onClose={() => setShowTeamManagement(false)}
        teams={teams}
        currentTeamId={currentTeamId}
        onSwitchTeam={handleSwitchTeam}
        onCreateTeam={handleCreateTeam}
      />
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}