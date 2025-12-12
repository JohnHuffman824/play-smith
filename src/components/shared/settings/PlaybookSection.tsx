import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function PlaybookSection() {
	const {
		autoSaveInterval,
		setAutoSaveInterval,
		showPlayCount,
		setShowPlayCount,
		confirmBeforeDelete,
		setConfirmBeforeDelete,
	} = useSettings()

	return (
		<div>
			<h3 className="text-lg font-medium mb-4">Playbooks</h3>
			<div className="space-y-4">
				{/* Auto-save Interval */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Auto-save Interval</label>
						<p className="text-sm text-muted-foreground">
							How often to automatically save changes
						</p>
					</div>
					<Select value={autoSaveInterval} onValueChange={setAutoSaveInterval}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10 seconds</SelectItem>
							<SelectItem value="30">30 seconds</SelectItem>
							<SelectItem value="60">1 minute</SelectItem>
							<SelectItem value="300">5 minutes</SelectItem>
							<SelectItem value="manual">Manual only</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Show Play Count */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Show Play Count</label>
						<p className="text-sm text-muted-foreground">
							Display the number of plays on playbook cards
						</p>
					</div>
					<Switch checked={showPlayCount} onCheckedChange={setShowPlayCount} />
				</div>

				{/* Confirm Before Delete */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Confirm Before Delete</label>
						<p className="text-sm text-muted-foreground">
							Show confirmation dialog when deleting playbooks or plays
						</p>
					</div>
					<Switch checked={confirmBeforeDelete} onCheckedChange={setConfirmBeforeDelete} />
				</div>
			</div>
		</div>
	)
}
