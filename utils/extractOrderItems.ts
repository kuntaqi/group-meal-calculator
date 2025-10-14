import Tesseract from "tesseract.js";
import { extractTextFromPdf } from "./pdfParser";

export interface OrderItem {
	name: string;
	qty: number;
	price: number;
}

export interface OrderItemsResult {
	platform: "gojek" | "grab" | "unknown";
	items: OrderItem[];
}

export async function extractOrderItems(file: File): Promise<OrderItemsResult> {
	const isPdf = file.type === "application/pdf";
	let text = "";

	if (isPdf) {
		try {
			text = await extractTextFromPdf(file);
		} catch (error) {
			console.error("PDF parsing error:", error);
			throw new Error("Failed to parse PDF. Please try again or use an image instead.");
		}
	} else {
		const result = await Tesseract.recognize(file, "eng");
		text = result.data.text;
	}

	const lower = text.toLowerCase();

	console.log("📄 OCR raw text:\n", text);

	if (lower.includes("gofood") || lower.includes("gojek"))
		return { platform: "gojek", items: parseGojekItems(text) };

	if (/GF-\d+/i.test(text))
		return { platform: "grab", items: parseGrabItems(text) };

	if (lower.includes("grabfood") || lower.includes("grab"))
		return { platform: "grab", items: parseGrabItems(text) };

	const grabLike = /\d{1,2}\.\d{3}(?!,)/.test(text);
	const gojekLike = /Rp\s?\d/.test(text);

	if (grabLike && !gojekLike) {
		console.log("⚡ Detected Grab-like format");
		return { platform: "grab", items: parseGrabItems(text) };
	}

	if (gojekLike) {
		console.log("⚡ Detected Gojek-like format");
		return { platform: "gojek", items: parseGojekItems(text) };
	}

	console.log("Does not match any platform");
	return { platform: "unknown", items: [] };
}

function parseGojekItems(text: string) {
	const items: { name: string; qty: number; price: number }[] = [];

	let clean = text
		.replace(/[\u200B-\u200D\uFEFF]/g, "")
		.replace(/[“”‘’]/g, '"')
		.replace(/©|¢|®/g, "@")
		.replace(/\s+/g, " ")
		.replace(/,/g, ".")
		.replace(/rp/gi, "Rp")
		.trim();

	const startIdx = clean.toLowerCase().indexOf("rincian transaksi");
	if (startIdx !== -1) clean = clean.substring(startIdx);

	const regex =
		/(\d+)\s+([A-Za-z0-9À-ÿ .,'()\/\-\+]+?)\s*@?\s*R[pP]\.?\s*([\d.]+)\s+R[pP]\.?\s*([\d.]+)/g;

	let match;
	while ((match = regex.exec(clean)) !== null) {
		const qty = parseInt(match[1], 10) || 1;
		const name = match[2].trim();
		const price =
			parseInt(match[4].replace(/\./g, ""), 10) ||
			parseInt(match[3].replace(/\./g, ""), 10) ||
			0;

		if (name && price > 0) {
			items.push({ name, qty, price });
		}
	}

	console.log("🧾 Clean Gojek text:", clean);
	console.log("📦 Gojek items parsed:", items);
	return items;
}

function parseGrabItems(text: string): OrderItem[] {
	text = text
		.replace(/[\u200B-\u200D\uFEFF]/g, "")
		.replace(/["'""''•@]/g, "")
		.replace(/\s+/g, " ")
		.replace(/(\d{1,3}[.,]\d{3})/g, "$1\n")
		.replace(/(x\s+[A-Z])/g, "\n$1")
		.trim();

	const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
	const items: OrderItem[] = [];

	const itemPattern = /^(?:x\s*)?([A-Za-z0-9 .,'()\/\-]+?)\s+(?:Rp\s*)?(\d{1,3}(?:[.,]\d{3})+)$/i;

	for (const line of lines) {
		if (/subtotal|total|diskon|delivery|ongkos|fee|pemesanan|hemat|profile|cutlery|thanks/i.test(line)) continue;

		const match = line.match(itemPattern);
		if (match) {
			const name = match[1].trim();
			const priceStr = match[2].replace(/\./g, "").replace(/,/g, "");
			const price = parseInt(priceStr, 10);
			if (name && price > 0) items.push({ name, qty: 1, price });
		} else {
			console.log("⚠️ No match for:", line);
		}
	}

	console.log("✅ Detected items:", items);
	return items;
}