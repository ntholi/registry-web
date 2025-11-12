import type { getAcademicRemarks } from '@/lib/utils/grades';
import type { getStudentByUserId } from '@/server/registry/students/actions';

export type Student = NonNullable<
	Awaited<ReturnType<typeof getStudentByUserId>>
>;

export type AcademicRemarks = Awaited<ReturnType<typeof getAcademicRemarks>>;

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

export function getCurrentSemester(student: Student | null | undefined) {
	if (!student) return null;
	const activeProgram = getActiveProgram(student);
	return activeProgram?.semesters.sort((a, b) => b.id - a.id)[0];
}

export function getNextSemesterNo(student: Student | null) {
	if (!student) return '1';

	const currentSemester =
		getCurrentSemester(student)?.structureSemester?.semesterNumber;
	if (!currentSemester) return '1';

	const currentNum = Number.parseInt(currentSemester, 10);
	const semesterNos =
		currentNum % 2 === 0 ? ['2', '4', '6', '8'] : ['1', '3', '5', '7'];

	const allSemesters = student.programs
		.flatMap((program) => program.semesters)
		.filter((semester) => {
			const semNo = semester.structureSemester?.semesterNumber;
			return semNo && semesterNos.includes(semNo);
		});
	const maxSemesterNo = Math.max(
		...allSemesters.map((semester) => {
			const semNo = semester.structureSemester?.semesterNumber;
			return semNo ? Number.parseInt(semNo, 10) : 0;
		})
	);
	return String(maxSemesterNo + 1);
}
