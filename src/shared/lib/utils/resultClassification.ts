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
	const compact = raw.replace(/\s+/g, '');

	if (raw.includes('first class')) return 'Merit';
	if (raw.includes('second class')) {
		if (
			raw.includes('upper') ||
			raw.includes('2 1') ||
			raw.includes('class a') ||
			raw.includes('division a') ||
			compact.includes('secondclassa') ||
			compact.includes('2a')
		) {
			return 'Merit';
		}
		if (
			raw.includes('lower') ||
			raw.includes('2 2') ||
			raw.includes('class b') ||
			raw.includes('division b') ||
			compact.includes('secondclassb') ||
			compact.includes('2b')
		) {
			return 'Credit';
		}
		return 'Credit';
	}
	if (raw.includes('third class')) return 'Pass';

	if (compact.includes('withdistinction') || compact === 'distinction')
		return 'Distinction';
	if (
		compact.includes('withmerit') ||
		compact === 'merit' ||
		compact === 'marit'
	)
		return 'Merit';
	if (compact.includes('withcredit') || compact === 'credit') return 'Credit';
	if (raw === 'pass' || compact === 'pass') return 'Pass';
	if (raw === 'fail') return 'Fail';

	return null;
}
