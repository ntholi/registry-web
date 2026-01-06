export function isValidStudentNumber(
	value: string | number | unknown
): boolean {
	if (typeof value === 'number') {
		value = value.toString();
	}

	if (typeof value !== 'string') {
		return false;
	}

	const cleaned = value.replace(/\s/g, '');
	return /^901\d{6}$/.test(cleaned);
}

export function normalizeStudentNumber(
	value: string | number | unknown
): string | null {
	if (typeof value === 'number') {
		value = value.toString();
	}

	if (typeof value !== 'string') {
		return null;
	}

	const cleaned = value.replace(/\s/g, '');
	return isValidStudentNumber(cleaned) ? cleaned : null;
}

export function columnLetterToIndex(letter: string): number {
	let result = 0;
	for (let i = 0; i < letter.length; i++) {
		result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
	}
	return result - 1;
}

export function columnIndexToLetter(index: number): string {
	let result = '';
	while (index >= 0) {
		result = String.fromCharCode((index % 26) + 'A'.charCodeAt(0)) + result;
		index = Math.floor(index / 26) - 1;
	}
	return result;
}

export function parseNumericValue(
	value: string | number | unknown
): number | null {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}

	if (typeof value === 'string') {
		const num = parseFloat(value.replace(/\s/g, ''));
		return !Number.isNaN(num) && Number.isFinite(num) ? num : null;
	}

	return null;
}

export function findColumnByHeader(
	headers: string[],
	searchText: string
): number | null {
	const normalizedSearch = searchText.toLowerCase().trim();

	for (let i = 0; i < headers.length; i++) {
		const header = (headers[i] || '').toString().toLowerCase().trim();
		if (header === normalizedSearch || header.includes(normalizedSearch)) {
			return i;
		}
	}

	return null;
}

export function fuzzyMatch(text1: string, text2: string): number {
	const s1 = text1.toLowerCase().trim();
	const s2 = text2.toLowerCase().trim();

	if (s1 === s2) return 1;
	if (s1.includes(s2) || s2.includes(s1)) return 0.8;

	const words1 = s1.split(/\s+/);
	const words2 = s2.split(/\s+/);

	let matches = 0;
	for (const word1 of words1) {
		for (const word2 of words2) {
			if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
				matches++;
				break;
			}
		}
	}

	return matches / Math.max(words1.length, words2.length);
}
