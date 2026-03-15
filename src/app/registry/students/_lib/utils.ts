import type { ActionData } from '@/shared/lib/utils/actionResult';
import type { getAcademicRemarks } from '@/shared/lib/utils/grades';
import { isActiveSemester } from '@/shared/lib/utils/utils';
import type {
	getAcademicHistory,
	getStudentByUserId,
} from '../_server/actions';

export type Student = NonNullable<ActionData<typeof getStudentByUserId>>;

export type StudentWithHistory = NonNullable<
	ActionData<typeof getAcademicHistory>
>;

export type StudentProgram = Student['programs'][number];

export type AcademicHistoryProgram = StudentWithHistory['programs'][number];

export type AcademicRemarks = ActionData<typeof getAcademicRemarks>;

export function getActiveProgram(student: Student | null | undefined) {
	if (!student) return null;
	const activeProgram = student.programs
		.sort((a, b) => b.id - a.id)
		.find((p) => p.status === 'Active');

	if (!activeProgram) return null;

	return {
		...activeProgram,
		name: activeProgram.structure.program.name,
		code: activeProgram.structure.program.code,
		schoolName: activeProgram.structure.program.school?.name || '',
		schoolId: activeProgram.structure.program.school?.id || 0,
	};
}

export function getCurrentSemester(
	student: Student | null | undefined,
	excludeTermCodes: string[] = []
) {
	if (!student) return null;
	const activeProgram = getActiveProgram(student);
	const excludeSet = new Set(excludeTermCodes);
	return activeProgram?.semesters
		.filter((s) => isActiveSemester(s.status) && !excludeSet.has(s.termCode))
		.sort((a, b) => b.id - a.id)[0];
}

export function getNextSemesterNo(student: Student | null) {
	if (!student) return '01';

	const allSemesters = student.programs
		.filter((p) => p.status === 'Active')
		.flatMap((program) => program.semesters)
		.filter((semester) => {
			const semNo = semester.structureSemester?.semesterNumber;
			return semNo && isActiveSemester(semester.status);
		});

	if (allSemesters.length === 0) return '01';

	const maxSemesterNo = Math.max(
		...allSemesters.map((semester) => {
			const semNo = semester.structureSemester?.semesterNumber;
			return semNo ? Number.parseInt(semNo, 10) : 0;
		})
	);
	return String(maxSemesterNo + 1).padStart(2, '0');
}
