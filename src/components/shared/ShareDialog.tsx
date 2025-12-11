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
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 
          flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-card rounded-2xl border border-border 
            shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between px-6 py-4
              border-b border-border"
          >
            <h2>Share Playbook</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-auto w-auto p-1.5"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-muted-foreground mb-1">Sharing</p>
              <p className="font-medium">{playbookName}</p>
            </div>

            <div 
              className="bg-muted/30 rounded-xl p-4 
                border border-border"
            >
              <div 
                className="flex items-center justify-between gap-3"
              >
                <div 
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
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
                <Button
                  onClick={handleCopyLink}
                  variant="default"
                  className="whitespace-nowrap"
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

            <div>
              <label className="block mb-2">Share with people</label>
              
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Mail 
                    className="absolute left-3 top-1/2 -translate-y-1/2 
                      w-4 h-4 text-muted-foreground" 
                  />
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
                    className="w-full pl-10 pr-4 py-2.5 
                      bg-input-background rounded-lg border-0 
                      outline-none focus:ring-2 focus:ring-ring/20 
                      transition-all duration-200"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="min-w-[140px] justify-between h-auto py-2.5 cursor-pointer"
                    >
                      <span>
                        {defaultRole == ROLE_VIEWER ? 'Viewer' : 'Collaborator'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem
                      onClick={() => setDefaultRole(ROLE_VIEWER)}
                      className="flex-col items-start h-auto py-2"
                    >
                      <div className="font-medium">Viewer</div>
                      <div className="text-muted-foreground text-sm">
                        Can view only
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDefaultRole(ROLE_COLLABORATOR)}
                      className="flex-col items-start h-auto py-2"
                    >
                      <div className="font-medium">Collaborator</div>
                      <div className="text-muted-foreground text-sm">
                        Can edit and share
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleAddEmail}
                  disabled={!canAddEmail}
                  variant="secondary"
                  className="h-auto py-2.5"
                >
                  Add
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.email}
                      className="flex items-center justify-between 
                        bg-muted/30 rounded-lg px-4 py-2.5 
                        border border-border gap-3"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div 
                          className="w-8 h-8 rounded-full bg-primary/10 
                            flex items-center justify-center flex-shrink-0"
                        >
                          <span className="text-primary">
                            {recipient.email[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate">{recipient.email}</span>
                      </div>
                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-auto py-1.5 bg-accent/50 hover:bg-accent cursor-pointer"
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
                          <DropdownMenuContent align="end" className="min-w-[200px]">
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(recipient.email, ROLE_VIEWER)}
                              className="flex-col items-start h-auto py-2"
                            >
                              <div className="font-medium">Viewer</div>
                              <div className="text-muted-foreground text-sm">
                                Can view only
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(recipient.email, ROLE_COLLABORATOR)}
                              className="flex-col items-start h-auto py-2"
                            >
                              <div className="font-medium">
                                Collaborator
                              </div>
                              <div className="text-muted-foreground text-sm">
                                Can edit and share
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          onClick={() => handleRemoveEmail(recipient.email)}
                          variant="ghost"
                          size="icon"
                          className="h-auto w-auto p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-muted-foreground">
              Recipients will receive an email with a link to view this playbook.
            </p>
          </div>

          <div
            className="flex justify-end gap-2 px-6 py-4
              border-t border-border bg-muted/20"
          >
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
    </>
  )
}
