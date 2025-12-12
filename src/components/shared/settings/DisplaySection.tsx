import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export function DisplaySection() {
	const { viewMode, setViewMode, cardsPerRow, setCardsPerRow } = useSettings()

	return (
		<div>
			<h3 className="text-lg font-medium mb-4">Display</h3>
			<div className="space-y-4">
				{/* View Mode */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Default View Mode</label>
						<p className="text-sm text-muted-foreground">
							Choose how playbooks are displayed by default
						</p>
					</div>
					<Select value={viewMode} onValueChange={setViewMode}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="grid">Grid</SelectItem>
							<SelectItem value="list">List</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Cards per Row */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Cards per Row</label>
						<p className="text-sm text-muted-foreground">
							Number of playbook cards to display per row in grid view
						</p>
					</div>
					<Select value={cardsPerRow.toString()} onValueChange={(val) => setCardsPerRow(Number(val))}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="2">2</SelectItem>
							<SelectItem value="3">3</SelectItem>
							<SelectItem value="4">4</SelectItem>
							<SelectItem value="5">5</SelectItem>
							<SelectItem value="6">6</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}
