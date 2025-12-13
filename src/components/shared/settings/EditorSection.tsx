import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import './settings-section.css'

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
		<div className="settings-section">
			<h3 className="settings-section-title">Editor</h3>
			<div className="settings-section-content">
				{/* Position Naming System */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Position Naming System</label>
						<p className="settings-description">
							Letters representing different offensive skill positions
						</p>
					</div>
					<div className="settings-control">
						<Select value={positionNaming} onValueChange={setPositionNaming}>
							<SelectTrigger className="settings-select-trigger">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="traditional">X, Y, Z, A, B, Q</SelectItem>
								<SelectItem value="modern">X, Y, Z, F, T, Q</SelectItem>
								<SelectItem value="numeric">Custom</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Competition Level */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Competition Level</label>
						<p className="settings-description">
							Determines hash mark distances and field specifications
						</p>
					</div>
					<div className="settings-control">
						<Select value={fieldLevel} onValueChange={setFieldLevel}>
							<SelectTrigger className="settings-select-trigger">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="high-school">High School</SelectItem>
								<SelectItem value="college">College</SelectItem>
								<SelectItem value="pro">Pro</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Default Personnel */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Default Personnel</label>
						<p className="settings-description">
							Auto-fill personnel package for new plays
						</p>
					</div>
					<div className="settings-control">
						<Select value={defaultPersonnel} onValueChange={setDefaultPersonnel}>
							<SelectTrigger className="settings-select-trigger">
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
				</div>

				{/* Auto-mirror Routes */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Auto-mirror Routes</label>
						<p className="settings-description">
							Automatically create mirrored versions of new routes
						</p>
					</div>
					<div className="settings-control">
						<Switch checked={autoMirrorRoutes} onCheckedChange={setAutoMirrorRoutes} />
					</div>
				</div>
			</div>
		</div>
	)
}
