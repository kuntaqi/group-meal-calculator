let pdfjsLib: any = null;

async function initPdfJs() {
	if (pdfjsLib) return pdfjsLib;

	if (typeof window !== 'undefined') {
		pdfjsLib = await import('pdfjs-dist');

		const pdfjsVersion = '3.11.174';
		pdfjsLib.GlobalWorkerOptions.workerSrc =
			`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
	}

	return pdfjsLib;
}

export async function extractTextFromPdf(file: File): Promise<string> {
	try {
		const pdfjs = await initPdfJs();

		if (!pdfjs) {
			throw new Error('PDF.js not available');
		}

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
		const pdf = await loadingTask.promise;

		let fullText = '';

		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.map((item: any) => item.str)
				.join(' ');
			fullText += pageText + '\n';
		}

		return fullText;
	} catch (error) {
		console.error('PDF extraction error:', error);
		throw new Error('Failed to extract text from PDF');
	}
}