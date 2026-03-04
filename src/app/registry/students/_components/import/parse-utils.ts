import { maritalStatusEnum } from '@registry/_database';
import * as XLSX from 'xlsx';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import {
	type ColumnMapping,
	HEADER_SYNONYMS,
	type ParsedStudent,
} from './types';

export function autoMapColumns(headers: string[]): ColumnMapping {
	const mapping: ColumnMapping = {};
	const usedFields = new Set<string>();

	for (let i = 0; i < headers.length; i++) {
		const header = headers[i].toLowerCase().trim();
		let bestMatch: string | null = null;

		for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
			if (usedFields.has(field)) continue;
			if (
				synonyms.some(
					(s) =>
						header === s ||
						header.includes(s) ||
						s.includes(header) ||
						levenshtein(header, s) <= 3
				)
			) {
				bestMatch = field;
				break;
			}
		}

		mapping[i] = bestMatch ?? '_skip';
		if (bestMatch) usedFields.add(bestMatch);
	}

	return mapping;
}

function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0)
	);
	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] =
				a[i - 1] === b[j - 1]
					? dp[i - 1][j - 1]
					: 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
		}
	}
	return dp[m][n];
}

function normalizeGender(val: string): string {
	const v = val.trim().toLowerCase();
	if (v === 'male' || v === 'm') return 'Male';
	if (v === 'female' || v === 'f') return 'Female';
	return 'Unknown';
}

function normalizeMaritalStatus(val: string): string {
	const v = val.trim().toLowerCase();
	for (const s of maritalStatusEnum.enumValues) {
		if (s.toLowerCase() === v) return s;
	}
	return '';
}

function parseExcelDate(val: string | number | null | undefined): string {
	if (!val) return '';
	if (typeof val === 'number') {
		const date = XLSX.SSF.parse_date_code(val);
		if (date) {
			return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
		}
		return '';
	}
	const str = String(val).trim();
	if (!str) return '';

	const slashParts = str.split('/');
	if (slashParts.length === 3) {
		const [p1, p2, p3] = slashParts;
		const month = Number.parseInt(p1, 10);
		const day = Number.parseInt(p2, 10);
		let year = Number.parseInt(p3, 10);
		if (year < 100) year += year > 50 ? 1900 : 2000;
		if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
			return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		}
	}

	const d = new Date(str);
	if (!Number.isNaN(d.getTime())) {
		return formatDateToISO(d);
	}
	return '';
}

export function extractRows(
	rawRows: (string | number | null | undefined)[][],
	headers: string[],
	mapping: ColumnMapping
): ParsedStudent[] {
	const students: ParsedStudent[] = [];

	for (const row of rawRows) {
		const record: Record<string, string> = {};
		for (let col = 0; col < headers.length; col++) {
			const field = mapping[col];
			if (!field || field === '_skip') continue;
			record[field] = String(row[col] ?? '').trim();
		}

		if (!record.name) continue;

		students.push({
			name: record.name || '',
			nationalId: record.nationalId || '',
			gender: normalizeGender(record.gender || ''),
			dateOfBirth: parseExcelDate(record.dateOfBirth),
			phone1: record.phone1 || '',
			phone2: record.phone2 || '',
			country: record.country || 'Lesotho',
			nationality: record.nationality || 'Mosotho',
			birthPlace: record.birthPlace || '',
			religion: record.religion || '',
			race: record.race || '',
			maritalStatus: normalizeMaritalStatus(record.maritalStatus || ''),
			courseOfStudy: record.courseOfStudy || '',
			kinName: record.kinName || '',
			kinPhone: record.kinPhone || '',
		});
	}

	return students;
}
