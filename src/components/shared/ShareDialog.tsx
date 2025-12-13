import {
  X,
  Mail,
  Link as LinkIcon,
  Check,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import './share-dialog.css'

type ShareRecipient = {
  email: string
  role: 'viewer' | 'collaborator'
}

type ShareDialogProps = {
  isOpen: boolean
  onClose: () => void
  playbookName: string
  onShare: (recipients: ShareRecipient[]) => void
}

const ROLE_VIEWER = 'viewer'
const ROLE_COLLABORATOR = 'collaborator'
const LINK_COPIED_TIMEOUT_MS = 2000

export function ShareDialog({ 
  isOpen, 
  onClose, 
  playbookName, 
  onShare 
}: ShareDialogProps) {
  const [emailInput, setEmailInput] = useState('')
  const [recipients, setRecipients] = useState<ShareRecipient[]>([])
  const [linkCopied, setLinkCopied] = useState(false)
  const [defaultRole, setDefaultRole] = useState<'viewer' | 'collaborator'>(ROLE_VIEWER)

  if (!isOpen) return null

  function handleAddEmail() {
    const trimmedEmail = emailInput.trim()
    const emailExists = recipients.some(r => r.email == trimmedEmail)
    
    if (trimmedEmail && trimmedEmail.includes('@') && !emailExists) {
      setRecipients([...recipients, { email: trimmedEmail, role: defaultRole }])
      setEmailInput('')
    }
  }

  function handleRemoveEmail(emailToRemove: string) {
    setRecipients(recipients.filter((recipient) => recipient.email != emailToRemove))
  }

  function handleRoleChange(email: string, newRole: 'viewer' | 'collaborator') {
    setRecipients(recipients.map((recipient) =>
      recipient.email == email ? { ...recipient, role: newRole } : recipient
    ))
  }

  function handleShare() {
    if (recipients.length > 0) {
      onShare(recipients)
      setRecipients([])
      setEmailInput('')
      onClose()
    }
  }

  function handleCopyLink() {
    const origin = window.location.origin
    const slug = playbookName.toLowerCase().replace(/\s+/g, '-')
    const shareLink = `${origin}/shared/${slug}`
    navigator.clipboard.writeText(shareLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), LINK_COPIED_TIMEOUT_MS)
  }

  const canAddEmail = emailInput.trim() && emailInput.includes('@')
  const shareButtonText = recipients.length == 1 
    ? 'Share with 1 person' 
    : `Share with ${recipients.length} people`

  return (
    <div className="share-dialog-backdrop" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Share Playbook</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="share-dialog-close-button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="share-dialog-body">
            <div className="share-playbook-info">
              <p className="share-playbook-label">Sharing</p>
              <p className="share-playbook-name">{playbookName}</p>
            </div>

            <div className="share-link-section">
              <div className="share-link-content">
                <div className="share-link-info">
                  <div className="share-link-icon">
                    <LinkIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="share-link-text">
                    <p className="share-link-title">Share via link</p>
                    <p className="share-link-description">
                      Anyone with the link can view
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="default"
                  className="share-dialog-copy-button"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    'Copy Link'
                  )}
                </Button>
              </div>
            </div>

            <div className="share-email-section">
              <label className="share-email-label">Share with people</label>

              <div className="share-email-input-row">
                <div className="share-email-input-wrapper">
                  <Mail className="share-email-input-icon" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key == 'Enter') {
                        e.preventDefault()
                        handleAddEmail()
                      }
                    }}
                    placeholder="Enter email address..."
                    className="share-email-input"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="share-dialog-role-selector"
                    >
                      <span>
                        {defaultRole == ROLE_VIEWER ? 'Viewer' : 'Collaborator'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="share-dialog-dropdown-content">
                    <DropdownMenuItem
                      onClick={() => setDefaultRole(ROLE_VIEWER)}
                      className="share-dialog-dropdown-item"
                    >
                      <div className="share-dialog-role-label">Viewer</div>
                      <div className="share-dialog-role-description">
                        Can view only
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDefaultRole(ROLE_COLLABORATOR)}
                      className="share-dialog-dropdown-item"
                    >
                      <div className="share-dialog-role-label">Collaborator</div>
                      <div className="share-dialog-role-description">
                        Can edit and share
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleAddEmail}
                  disabled={!canAddEmail}
                  variant="secondary"
                  className="share-dialog-add-button"
                >
                  Add
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="share-recipients-list">
                  {recipients.map((recipient) => (
                    <div key={recipient.email} className="share-recipient-item">
                      <div className="share-recipient-info">
                        <div className="share-recipient-avatar">
                          <span>
                            {recipient.email[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="share-recipient-email">{recipient.email}</span>
                      </div>
                      <div className="share-recipient-actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="share-dialog-recipient-role-button"
                            >
                              <span>
                                {recipient.role == ROLE_VIEWER
                                  ? 'Viewer'
                                  : 'Collaborator'
                                }
                              </span>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="share-dialog-dropdown-content">
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(recipient.email, ROLE_VIEWER)}
                              className="share-dialog-dropdown-item"
                            >
                              <div className="share-dialog-role-label">Viewer</div>
                              <div className="share-dialog-role-description">
                                Can view only
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(recipient.email, ROLE_COLLABORATOR)}
                              className="share-dialog-dropdown-item"
                            >
                              <div className="share-dialog-role-label">
                                Collaborator
                              </div>
                              <div className="share-dialog-role-description">
                                Can edit and share
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          onClick={() => handleRemoveEmail(recipient.email)}
                          variant="ghost"
                          size="icon"
                          className="share-dialog-remove-button"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="share-dialog-note">
              Recipients will receive an email with a link to view this playbook.
            </p>
        </div>

        <div className="share-dialog-footer">
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={recipients.length == 0}
            variant="default"
          >
            {shareButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
