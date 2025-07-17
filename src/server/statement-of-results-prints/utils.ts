import { getAcademicHistory } from '@/server/students/actions';
import { getAcademicRemarks, grades, summarizeModules } from '@/utils/grades';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
type Semester = Student['programs'][0]['semesters'][0];
type StudentModule = Semester['studentModules'][0];

interface Program {
  id: number;
  status: string;
  semesters?: Semester[];
  structure: {
    program: {
      name: string;
    };
  };
}

function calculateCumulativeStats(programs: Program[]) {
  try {
    const allModules: StudentModule[] = [];

    if (!programs || programs.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        totalModules: 0,
      };
    }

    programs.forEach((program) => {
      if (!program || !program.semesters) return;

      program.semesters.forEach((semester: Semester) => {
        if (!semester || !semester.studentModules) return;

        semester.studentModules.forEach((sm: StudentModule) => {
          if (!sm || !sm.semesterModule || sm.grade == null) return;
          allModules.push(sm);
        });
      });
    });

    if (allModules.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        totalModules: 0,
      };
    }

    const summary = summarizeModules(allModules);

    return {
      gpa: Math.round((summary.gpa || 0) * 100) / 100,
      totalCredits: summary.creditsCompleted || 0,
      totalCreditsAttempted: summary.creditsAttempted || 0,
      totalModules: allModules.filter(
        (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
      ).length,
    };
  } catch (error) {
    console.error('Error calculating cumulative stats:', error);
    return {
      gpa: 0,
      totalCredits: 0,
      totalCreditsAttempted: 0,
      totalModules: 0,
    };
  }
}

function getClassification(gpa: number): string {
  const gradesWithGPA = grades
    .filter((grade) => grade.gpa !== null)
    .sort((a, b) => (b.gpa || 0) - (a.gpa || 0));
  const matchingGrade = gradesWithGPA.find((grade) => gpa >= (grade.gpa || 0));
  return matchingGrade?.description || 'No Classification';
}

export function extractStatementOfResultsData(student: Student) {
  const programs = (student.programs || []).filter(
    (program) => program && program.status === 'Active',
  );

  const cumulativeStats = calculateCumulativeStats(programs);
  const academicRemarks = getAcademicRemarks(programs);

  const primaryProgram = programs[0];
  const programName =
    primaryProgram?.structure?.program?.name || 'Unknown Program';

  return {
    stdNo: student.stdNo,
    studentName: student.name,
    programName,
    totalCredits: cumulativeStats.totalCredits,
    totalModules: cumulativeStats.totalModules,
    cgpa: cumulativeStats.gpa,
    classification: getClassification(cumulativeStats.gpa),
    academicStatus: academicRemarks.status,
    graduationDate: null, // This would need to be determined based on program completion
  };
}
