import { getAcademicHistory } from '@/server/students/actions';
import { getAcademicRemarks, grades } from '@/utils/grades';
import type { Program as GradeProgram } from '@/utils/grades/type';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
type Semester = Student['programs'][0]['semesters'][0];
type StudentModule = Semester['studentModules'][0];

function getClassification(gpa: number): string {
  const gradesWithGPA = grades
    .filter((grade) => grade.points !== null)
    .sort((a, b) => (b.points || 0) - (a.points || 0));
  const matchingGrade = gradesWithGPA.find(
    (grade) => gpa >= (grade.points || 0),
  );
  return matchingGrade?.description || 'No Classification';
}

export function extractStatementOfResultsData(student: Student) {
  const programs = (student.programs || []).filter(
    (program) => program && program.status === 'Active',
  );

  const academicRemarks = getAcademicRemarks(programs as GradeProgram[]);
  const lastPoint = academicRemarks.points[academicRemarks.points.length - 1];

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
