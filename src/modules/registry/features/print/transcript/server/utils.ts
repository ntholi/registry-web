import type { getAcademicHistory } from '@registry/students';
import { getGradePoints } from '@/shared/lib/utils/grades';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

export function extractTranscriptData(student: Student) {
	const programs = (student.programs || []).filter(
		(program) => program && program.status === 'Completed'
	);
	const primaryProgram = programs[0];
	const programName =
		primaryProgram?.structure?.program?.name || 'Unknown Program';

	let totalCredits = 0;
	programs.forEach((program) => {
		program.semesters?.forEach((semester) => {
			semester.studentModules?.forEach((module) => {
				const grade = module.grade || '';
				const gradePoint = getGradePoints(grade);
				if (gradePoint > 0) {
					totalCredits += module.semesterModule?.credits || 0;
				}
			});
		});
	});

	let cgpaSum = 0;
	let cgpaTotalCredits = 0;
	programs.forEach((program) => {
		program.semesters?.forEach((semester) => {
			semester.studentModules?.forEach((module) => {
				const grade = module.grade || '';
				const credits = module.semesterModule?.credits || 0;
				const gradePoint = getGradePoints(grade);
				if (gradePoint > 0) {
					cgpaSum += gradePoint * credits;
					cgpaTotalCredits += credits;
				}
			});
		});
	});

	const cgpa = cgpaTotalCredits > 0 ? cgpaSum / cgpaTotalCredits : 0;

	return {
		stdNo: student.stdNo,
		studentName: student.name,
		programName,
		totalCredits,
		cgpa,
	};
}
