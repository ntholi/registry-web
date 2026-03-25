import { formatDate } from '@/shared/lib/utils/dates';
import { formatSemester } from '@/shared/lib/utils/utils';
import { PLACEHOLDERS } from './placeholders';

type StudentLetterData = {
	name: string;
	stdNo: number;
	nationalId: string | null;
	gender: 'Male' | 'Female' | 'Unknown' | null;
	dateOfBirth: Date | string | null;
	nationality: string | null;
	programs: {
		graduationDate: string | null;
		structure: {
			program: {
				name: string;
				school: { name: string } | null;
			} | null;
		} | null;
		semesters: {
			termCode: string;
			structureSemester: { semesterNumber: string } | null;
		}[];
	}[];
};

function genderPronoun(gender: string | null | undefined) {
	if (gender === 'Male') return 'He';
	if (gender === 'Female') return 'She';
	return 'They';
}

function genderPossessive(gender: string | null | undefined) {
	if (gender === 'Male') return 'His';
	if (gender === 'Female') return 'Her';
	return 'Their';
}

function extractTokens(html: string): string[] {
	const seen = new Set<string>();
	for (const m of html.matchAll(/\{\{(\w+)\}\}/g)) {
		seen.add(m[1]);
	}
	return [...seen];
}

export function findMissingPlaceholders(
	html: string,
	data: StudentLetterData
): string[] {
	const usedTokens = extractTokens(html);
	if (usedTokens.length === 0) return [];

	const program = data.programs?.[0];
	const structureSem = program?.semesters?.[0]?.structureSemester;
	const hasGender = !!data.gender && data.gender !== 'Unknown';

	const available: Record<string, boolean> = {
		studentName: !!data.name,
		stdNo: !!data.stdNo,
		nationalId: !!data.nationalId,
		dateOfBirth: !!data.dateOfBirth,
		nationality: !!data.nationality,
		gender: hasGender,
		genderPossessive: hasGender,
		programName: !!program?.structure?.program?.name,
		schoolName: !!program?.structure?.program?.school?.name,
		semesterName: !!structureSem?.semesterNumber,
		yearOfStudy: !!structureSem?.semesterNumber,
		graduationDate: !!program?.graduationDate,
		currentDate: true,
	};

	const tokenToLabel = new Map(PLACEHOLDERS.map((p) => [p.token, p.label]));

	return usedTokens
		.filter((token) => available[token] === false)
		.map((token) => tokenToLabel.get(token) ?? token);
}

export function resolveTemplate(html: string, data: StudentLetterData) {
	const program = data.programs?.[0];
	const semester = program?.semesters?.[0];
	const structureSem = semester?.structureSemester;

	const values: Record<string, string> = {
		studentName: data.name,
		stdNo: String(data.stdNo),
		nationalId: data.nationalId ?? '',
		dateOfBirth: formatDate(data.dateOfBirth),
		nationality: data.nationality ?? '',
		gender: genderPronoun(data.gender),
		genderPossessive: genderPossessive(data.gender),
		programName: program?.structure?.program?.name ?? '',
		schoolName: program?.structure?.program?.school?.name ?? '',
		semesterName: structureSem
			? formatSemester(structureSem.semesterNumber, 'full')
			: '',
		yearOfStudy: structureSem
			? `Year ${Math.ceil(Number(structureSem.semesterNumber) / 2)}`
			: '',
		graduationDate: program?.graduationDate
			? formatDate(program.graduationDate)
			: '',
		currentDate: formatDate(new Date()),
	};

	return html.replace(/\{\{(\w+)\}\}/g, (_, token) => values[token] ?? '');
}
