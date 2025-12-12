import { generateCallSheetPDF } from '../services/export/callSheetGenerator'
import type { ExportCallSheetRequest } from '../types/export.types'

export async function handleCallSheetExport(req: Request): Promise<Response> {
	const body: ExportCallSheetRequest = await req.json()

	const pdf = await generateCallSheetPDF(body.config)

	return new Response(pdf, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="call-sheet.pdf"`,
		},
	})
}
