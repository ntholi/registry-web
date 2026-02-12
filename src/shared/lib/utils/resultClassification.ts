import type { ResultClassification } from '@admissions/academic-records/_schema/academicRecords';

function normalizeClassificationText(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function normalizeResultClassification(
	value: string | null | undefined
): ResultClassification | null {
	if (!value) return null;

	const raw = normalizeClassificationText(value);
	if (!raw) return null;

	if (raw.includes('first class')) return 'Merit';
	if (raw.includes('second class')) {
		if (raw.includes('upper') || raw.includes('2 1')) return 'Merit';
		if (raw.includes('lower') || raw.includes('2 2')) return 'Credit';
		return 'Credit';
	}
	if (raw.includes('third class')) return 'Pass';

	if (raw === 'distinction') return 'Distinction';
	if (raw === 'merit') return 'Merit';
	if (raw === 'credit') return 'Credit';
	if (raw === 'pass') return 'Pass';
	if (raw === 'fail') return 'Fail';

	return null;
}
