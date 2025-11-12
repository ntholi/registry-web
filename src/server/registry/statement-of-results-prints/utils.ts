import { getAcademicRemarks, grades } from '@/lib/utils/grades';
import type { Program as GradeProgram } from '@/lib/utils/grades/type';
import type { getAcademicHistory } from '@/server/registry/students/actions';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

function getClassification(gpa: number): string {
	const gradesWithGPA = grades
		.filter((grade) => grade.points !== null)
		.sort((a, b) => (b.points || 0) - (a.points || 0));
	const matchingGrade = gradesWithGPA.find(
		(grade) => gpa >= (grade.points || 0)
	);
	return matchingGrade?.description || 'No Classification';
}

export function extractStatementOfResultsData(student: Student) {
	const programs = (student.programs || []).filter(
		(program) => program && program.status === 'Active'
	);

	const academicRemarks = getAcademicRemarks(programs as GradeProgram[]);
	const lastPoint = academicRemarks.latestPoints;

	const primaryProgram = programs[0];
	const programName =
		primaryProgram?.structure?.program?.name || 'Unknown Program';

	return {
		stdNo: student.stdNo,
		studentName: student.name,
		programName,
		totalCredits: lastPoint?.creditsCompleted || 0,
		totalModules: academicRemarks.totalModules,
		cgpa: lastPoint?.cgpa || 0,
		classification: getClassification(lastPoint?.cgpa || 0),
		academicStatus: academicRemarks.status,
		graduationDate: null, // This would need to be determined based on program completion
	};
}
