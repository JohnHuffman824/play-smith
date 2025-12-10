import { useParams } from 'react-router-dom'

export function PlaybookEditorPage() {
	const { playbookId } = useParams()

	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-6">
				Playbook {playbookId}
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="p-6 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
					<p className="text-gray-500">Play grid coming soon</p>
				</div>
			</div>
		</div>
	)
}
