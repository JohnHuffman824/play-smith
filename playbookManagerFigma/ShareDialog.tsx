import { X, Mail, Link as LinkIcon, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ShareRecipient {
  email: string;
  role: 'viewer' | 'collaborator';
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playbookName: string;
  onShare: (recipients: ShareRecipient[]) => void;
}

export function ShareDialog({ isOpen, onClose, playbookName, onShare }: ShareDialogProps) {
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [defaultRole, setDefaultRole] = useState<'viewer' | 'collaborator'>('viewer');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [activeRecipientMenu, setActiveRecipientMenu] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && trimmedEmail.includes('@') && !recipients.some(r => r.email === trimmedEmail)) {
      setRecipients([...recipients, { email: trimmedEmail, role: defaultRole }]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setRecipients(recipients.filter((recipient) => recipient.email !== emailToRemove));
  };

  const handleRoleChange = (email: string, newRole: 'viewer' | 'collaborator') => {
    setRecipients(recipients.map((recipient) =>
      recipient.email === email ? { ...recipient, role: newRole } : recipient
    ));
  };

  const handleShare = () => {
    if (recipients.length > 0) {
      onShare(recipients);
      setRecipients([]);
      setEmailInput('');
      onClose();
    }
  };

  const handleCopyLink = () => {
    // Mock link - in real app would be actual shareable link
    const shareLink = `https://playsmith.app/shared/${playbookName.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Dialog */}
        <div
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2>Share Playbook</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Playbook Name */}
            <div>
              <p className="text-muted-foreground mb-1">Sharing</p>
              <p className="font-medium">{playbookName}</p>
            </div>

            {/* Copy Link Section */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-card rounded-lg">
                    <LinkIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Share via link</p>
                    <p className="text-muted-foreground truncate">
                      Anyone with the link can view
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    'Copy Link'
                  )}
                </button>
              </div>
            </div>

            {/* Email Section */}
            <div>
              <label className="block mb-2">Share with people</label>
              
              {/* Email Input */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="Enter email address..."
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-between"
                  >
                    <span>{defaultRole === 'viewer' ? 'Viewer' : 'Collaborator'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showRoleMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowRoleMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[200px] z-30">
                        <button
                          onClick={() => {
                            setDefaultRole('viewer');
                            setShowRoleMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                        >
                          <div className="font-medium">Viewer</div>
                          <div className="text-muted-foreground">Can view only</div>
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button
                          onClick={() => {
                            setDefaultRole('collaborator');
                            setShowRoleMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                        >
                          <div className="font-medium">Collaborator</div>
                          <div className="text-muted-foreground">Can edit and share</div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleAddEmail}
                  disabled={!emailInput.trim() || !emailInput.includes('@')}
                  className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Email List */}
              {recipients.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.email}
                      className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 border border-border gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">
                            {recipient.email[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate">{recipient.email}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() => setActiveRecipientMenu(
                              activeRecipientMenu === recipient.email ? null : recipient.email
                            )}
                            className="px-3 py-1.5 bg-accent/50 hover:bg-accent rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                          >
                            <span>{recipient.role === 'viewer' ? 'Viewer' : 'Collaborator'}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {activeRecipientMenu === recipient.email && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveRecipientMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[200px] z-30">
                                <button
                                  onClick={() => {
                                    handleRoleChange(recipient.email, 'viewer');
                                    setActiveRecipientMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                                >
                                  <div className="font-medium">Viewer</div>
                                  <div className="text-muted-foreground">Can view only</div>
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button
                                  onClick={() => {
                                    handleRoleChange(recipient.email, 'collaborator');
                                    setActiveRecipientMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                                >
                                  <div className="font-medium">Collaborator</div>
                                  <div className="text-muted-foreground">Can edit and share</div>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveEmail(recipient.email)}
                          className="p-1 hover:bg-accent rounded transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Text */}
            <p className="text-muted-foreground">
              Recipients will receive an email with a link to view this playbook.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
            <button
              onClick={onClose}
              className="px-4 py-2 hover:bg-accent rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={recipients.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share with {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}