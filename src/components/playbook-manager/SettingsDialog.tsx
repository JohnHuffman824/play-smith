import { X } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface SettingsDialogProps {
	isOpen: boolean
	onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
	const { theme, setTheme } = useTheme()

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>

			{/* Dialog */}
			<div className="relative bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold">Settings</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-accent rounded-lg transition-colors"
						aria-label="Close settings"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-6">
					{/* Appearance Settings */}
					<section>
						<h3 className="text-lg font-medium mb-4">Appearance</h3>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Theme</label>
									<p className="text-sm text-muted-foreground">
										Choose your preferred color theme
									</p>
								</div>
								<select
									value={theme}
									onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
									className="px-4 py-2 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
								>
									<option value="light">Light</option>
									<option value="dark">Dark</option>
									<option value="system">System</option>
								</select>
							</div>
						</div>
					</section>

					{/* Display Settings */}
					<section>
						<h3 className="text-lg font-medium mb-4">Display</h3>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Default View Mode</label>
									<p className="text-sm text-muted-foreground">
										Choose how playbooks are displayed by default
									</p>
								</div>
								<select
									className="px-4 py-2 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
									defaultValue="grid"
								>
									<option value="grid">Grid</option>
									<option value="list">List</option>
								</select>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Cards per row</label>
									<p className="text-sm text-muted-foreground">
										Number of playbook cards to show per row
									</p>
								</div>
								<select
									className="px-4 py-2 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
									defaultValue="4"
								>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
									<option value="6">6</option>
								</select>
							</div>
						</div>
					</section>

					{/* Playbook Settings */}
					<section>
						<h3 className="text-lg font-medium mb-4">Playbooks</h3>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Auto-save interval</label>
									<p className="text-sm text-muted-foreground">
										How often to automatically save your changes
									</p>
								</div>
								<select
									className="px-4 py-2 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
									defaultValue="30"
								>
									<option value="10">10 seconds</option>
									<option value="30">30 seconds</option>
									<option value="60">1 minute</option>
									<option value="300">5 minutes</option>
									<option value="0">Manual only</option>
								</select>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Show play count</label>
									<p className="text-sm text-muted-foreground">
										Display the number of plays on each playbook card
									</p>
								</div>
								<input
									type="checkbox"
									defaultChecked
									className="w-5 h-5 rounded border-input"
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<label className="font-medium">Confirm before delete</label>
									<p className="text-sm text-muted-foreground">
										Ask for confirmation before deleting playbooks
									</p>
								</div>
								<input
									type="checkbox"
									defaultChecked
									className="w-5 h-5 rounded border-input"
								/>
							</div>
						</div>
					</section>
				</div>

				{/* Footer */}
				<div className="mt-6 pt-6 border-t border-border flex justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2 hover:bg-accent rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onClose}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	)
}
