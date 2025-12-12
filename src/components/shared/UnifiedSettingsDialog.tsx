import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AppearanceSection } from './settings/AppearanceSection'
import { EditorSection } from './settings/EditorSection'
import { DisplaySection } from './settings/DisplaySection'
import { PlaybackSection } from './settings/PlaybackSection'
import { PlaybookSection } from './settings/PlaybookSection'
import './unified-settings-dialog.css'

type SettingsContext = 'playbook-manager' | 'playbook-editor' | 'play-editor'

interface UnifiedSettingsDialogProps {
	isOpen: boolean
	onClose: () => void
	context: SettingsContext
}

export function UnifiedSettingsDialog({ isOpen, onClose, context }: UnifiedSettingsDialogProps) {
	if (!isOpen) return null

	return (
		<div className="unified-settings-backdrop" onClick={onClose}>
			<div className="unified-settings-dialog" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="unified-settings-header">
					<h2 className="unified-settings-title">Settings</h2>
					<Button onClick={onClose} variant="ghost" size="icon">
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Content */}
				<div className="unified-settings-content">
					{/* Appearance - Always show */}
					<AppearanceSection />
					<Separator />

					{/* Editor - Always show */}
					<EditorSection />

					{/* Display - Playbook Manager only */}
					{context === 'playbook-manager' && (
						<>
							<Separator />
							<DisplaySection />
						</>
					)}

					{/* Playback - Play Editor only */}
					{context === 'play-editor' && (
						<>
							<Separator />
							<PlaybackSection />
						</>
					)}

					{/* Playbook - Playbook Manager only */}
					{context === 'playbook-manager' && (
						<>
							<Separator />
							<PlaybookSection />
						</>
					)}
				</div>

				{/* Footer */}
				<div className="unified-settings-footer">
					<Button onClick={onClose} variant="default">
						Done
					</Button>
				</div>
			</div>
		</div>
	)
}
