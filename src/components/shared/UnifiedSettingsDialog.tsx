import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AppearanceSection } from './settings/AppearanceSection'
import { EditorSection } from './settings/EditorSection'
import { DisplaySection } from './settings/DisplaySection'
import { PlaybackSection } from './settings/PlaybackSection'
import { PlaybookSection } from './settings/PlaybookSection'

type SettingsContext = 'playbook-manager' | 'playbook-editor' | 'play-editor'

interface UnifiedSettingsDialogProps {
	isOpen: boolean
	onClose: () => void
	context: SettingsContext
}

export function UnifiedSettingsDialog({ isOpen, onClose, context }: UnifiedSettingsDialogProps) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Dialog */}
			<div className="relative bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold">Settings</h2>
					<Button onClick={onClose} variant="ghost" size="icon">
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Content */}
				<div className="space-y-6">
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
				<div className="mt-6 pt-6 border-t border-border flex justify-end">
					<Button onClick={onClose} variant="default">
						Done
					</Button>
				</div>
			</div>
		</div>
	)
}
