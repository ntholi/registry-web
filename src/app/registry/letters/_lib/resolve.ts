import { formatDate } from '@/shared/lib/utils/dates';
import { formatSemester } from '@/shared/lib/utils/utils';

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
		graduationDate: program?.graduationDate
			? formatDate(program.graduationDate)
			: '',
		currentDate: formatDate(new Date()),
	};

	return html.replace(/\{\{(\w+)\}\}/g, (_, token) => values[token] ?? '');
}
