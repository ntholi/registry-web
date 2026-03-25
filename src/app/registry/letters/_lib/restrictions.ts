import type { ProgramLevel } from '@academic/schools/_schema/programs';
import { programLevelEnum } from '@academic/schools/_schema/programs';
import {
	type StudentStatus,
	studentStatus,
} from '@registry/students/_schema/students';
import {
	programStatus,
	type SemesterStatus,
	type StudentProgramStatus,
	semesterStatus,
} from '@registry/students/_schema/types';

export const restrictionTypes = [
	'studentStatus',
	'semesterStatus',
	'programStatus',
	'programLevel',
	'semesterNumber',
	'school',
	'gender',
	'sponsored',
	'programName',
] as const;

export type RestrictionType = (typeof restrictionTypes)[number];

export type RestrictionOperator = 'include' | 'exclude';

export type Restriction = {
	type: RestrictionType;
	operator: RestrictionOperator;
	values: string[];
};

export const RESTRICTION_META: Record<
	RestrictionType,
	{ label: string; description: string; options?: string[] }
> = {
	studentStatus: {
		label: 'Student Status',
		description: 'Student account status (Active, Graduated, etc.)',
		options: studentStatus.enumValues as unknown as string[],
	},
	semesterStatus: {
		label: 'Semester Status',
		description:
			'Current semester registration status (Active, Enrolled, etc.)',
		options: semesterStatus.enumValues as unknown as string[],
	},
	programStatus: {
		label: 'Program Status',
		description: 'Program enrollment status (Active, Completed, etc.)',
		options: programStatus.enumValues as unknown as string[],
	},
	programLevel: {
		label: 'Program Level',
		description: 'Academic program level (certificate, diploma, degree)',
		options: programLevelEnum.enumValues as unknown as string[],
	},
	semesterNumber: {
		label: 'Semester',
		description: 'Specific semesters (e.g. Yr3 Sem2 for internship)',
		options: ['01', '02', '03', '04', '05', '06', '07', '08'],
	},
	school: {
		label: 'School',
		description: 'Restrict to specific schools/faculties',
	},
	gender: {
		label: 'Gender',
		description: 'Male or Female specific letters',
		options: ['Male', 'Female'],
	},
	sponsored: {
		label: 'Sponsorship',
		description: 'Only sponsored or only self-funded students',
		options: ['sponsored', 'self-funded'],
	},
	programName: {
		label: 'Program Name',
		description: 'Specific programs by name',
	},
};

export function formatSemesterNumber(sem: string): string {
	const n = Number.parseInt(sem, 10);
	const year = Math.ceil(n / 2);
	const s = n % 2 === 0 ? 2 : 1;
	return `Year ${year} Semester ${s}`;
}

export function formatRestrictionValues(r: Restriction): string {
	if (r.type === 'semesterNumber') {
		return r.values.map(formatSemesterNumber).join(', ');
	}
	if (r.type === 'sponsored') {
		return r.values
			.map((v) => (v === 'sponsored' ? 'Sponsored' : 'Self-funded'))
			.join(', ');
	}
	return r.values.join(', ');
}

const joinList = (items: string[]) => {
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
};

export function describeRestriction(r: Restriction): string {
	const verb = r.operator === 'include' ? 'must be' : 'must not be';
	const vals = formatRestrictionValues(r);
	const list = vals.split(', ');

	switch (r.type) {
		case 'studentStatus':
			return `Student status ${verb} ${joinList(list)}`;
		case 'semesterStatus':
			return `Semester status ${verb} ${joinList(list)}`;
		case 'programStatus':
			return `Program status ${verb} ${joinList(list)}`;
		case 'programLevel':
			return `Program level ${verb} ${joinList(list)}`;
		case 'semesterNumber':
			return `Student ${verb} in ${joinList(list)}`;
		case 'school':
			return `School ${verb} ${joinList(list)}`;
		case 'gender':
			return `Student ${verb} ${joinList(list)}`;
		case 'sponsored':
			return `Student ${verb} ${joinList(list)}`;
		case 'programName':
			return `Program ${verb} ${joinList(list)}`;
	}
}

type StudentData = {
	status: StudentStatus;
	gender: string | null;
	programs?: Array<{
		status: StudentProgramStatus;
		structure: {
			program: {
				name: string;
				level?: ProgramLevel;
				school: { id?: number; name: string } | null;
			};
		};
		semesters: Array<{
			status: SemesterStatus;
			sponsorId: number | null;
			structureSemester: { semesterNumber: string };
		}>;
	}>;
};

export function evaluateRestrictions(
	restrictions: Restriction[],
	student: StudentData
): string | null {
	const program = student.programs?.[0];
	const semester = program?.semesters?.[0];

	for (const r of restrictions) {
		const matches = checkRestriction(r, student, program, semester);
		if (r.operator === 'include' && !matches) {
			return `This letter requires ${RESTRICTION_META[r.type].label}: ${formatRestrictionValues(r)}`;
		}
		if (r.operator === 'exclude' && matches) {
			return `This letter excludes ${RESTRICTION_META[r.type].label}: ${formatRestrictionValues(r)}`;
		}
	}
	return null;
}

type Program = NonNullable<StudentData['programs']>[number];
type Semester = Program['semesters'][number];

function checkRestriction(
	r: Restriction,
	student: StudentData,
	program: Program | undefined,
	semester: Semester | undefined
): boolean {
	switch (r.type) {
		case 'studentStatus':
			return r.values.includes(student.status);
		case 'semesterStatus':
			return !!semester && r.values.includes(semester.status);
		case 'programStatus':
			return !!program && r.values.includes(program.status);
		case 'programLevel':
			return (
				!!program?.structure?.program?.level &&
				r.values.includes(program.structure.program.level)
			);
		case 'semesterNumber':
			return (
				!!semester &&
				r.values.includes(semester.structureSemester.semesterNumber)
			);
		case 'school':
			return (
				!!program?.structure?.program?.school?.name &&
				r.values.includes(program.structure.program.school.name)
			);
		case 'gender':
			return !!student.gender && r.values.includes(student.gender);
		case 'sponsored':
			if (r.values.includes('sponsored')) return !!semester?.sponsorId;
			if (r.values.includes('self-funded')) return !semester?.sponsorId;
			return false;
		case 'programName':
			return (
				!!program?.structure?.program?.name &&
				r.values.includes(program.structure.program.name)
			);
		default:
			return true;
	}
}
