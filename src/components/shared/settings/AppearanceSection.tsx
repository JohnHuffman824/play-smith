import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export function AppearanceSection() {
	const { theme, setTheme } = useSettings()

	return (
		<div>
			<h3 className="text-lg font-medium mb-4">Appearance</h3>
			<div className="flex items-center justify-between">
				<div>
					<label className="font-medium">Theme</label>
					<p className="text-sm text-muted-foreground">
						Choose your preferred color theme
					</p>
				</div>
				<Select value={theme} onValueChange={setTheme}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="light">Light</SelectItem>
						<SelectItem value="dark">Dark</SelectItem>
						<SelectItem value="system">System</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
