import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function EditorSection() {
	const {
		positionNaming,
		setPositionNaming,
		fieldLevel,
		setFieldLevel,
		defaultPersonnel,
		setDefaultPersonnel,
		autoMirrorRoutes,
		setAutoMirrorRoutes,
	} = useSettings()

	return (
		<div>
			<h3 className="text-lg font-medium mb-4">Editor</h3>
			<div className="space-y-4">
				{/* Position Naming System */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Position Naming System</label>
						<p className="text-sm text-muted-foreground">
							Letters representing different offensive skill positions
						</p>
					</div>
					<Select value={positionNaming} onValueChange={setPositionNaming}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="traditional">X, Y, Z, A, B, Q</SelectItem>
							<SelectItem value="modern">X, Y, Z, F, T, Q</SelectItem>
							<SelectItem value="numeric">Custom</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Competition Level */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Competition Level</label>
						<p className="text-sm text-muted-foreground">
							Determines hash mark distances and field specifications
						</p>
					</div>
					<Select value={fieldLevel} onValueChange={setFieldLevel}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="high-school">High School</SelectItem>
							<SelectItem value="college">College</SelectItem>
							<SelectItem value="pro">Pro</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Default Personnel */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Default Personnel</label>
						<p className="text-sm text-muted-foreground">
							Auto-fill personnel package for new plays
						</p>
					</div>
					<Select value={defaultPersonnel} onValueChange={setDefaultPersonnel}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="11">11 Personnel</SelectItem>
							<SelectItem value="10">10 Personnel</SelectItem>
							<SelectItem value="12">12 Personnel</SelectItem>
							<SelectItem value="13">13 Personnel</SelectItem>
							<SelectItem value="21">21 Personnel</SelectItem>
							<SelectItem value="22">22 Personnel</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Auto-mirror Routes */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Auto-mirror Routes</label>
						<p className="text-sm text-muted-foreground">
							Automatically create mirrored versions of new routes
						</p>
					</div>
					<Switch checked={autoMirrorRoutes} onCheckedChange={setAutoMirrorRoutes} />
				</div>
			</div>
		</div>
	)
}
