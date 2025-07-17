import { gradeEnum, StudentModuleStatus } from '@/db/schema';
import { Program } from './type';

export type GradeRange = {
  min: number;
  max: number;
};

export type GradeDefinition = {
  grade: (typeof gradeEnum)[number];
  gpa: number | null;
  description: string;
  marksRange?: GradeRange;
};

export const grades: GradeDefinition[] = [
  {
    grade: 'A+',
    gpa: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 90, max: 100 },
  },
  {
    grade: 'A',
    gpa: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 85, max: 89 },
  },
  {
    grade: 'A-',
    gpa: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 80, max: 84 },
  },
  {
    grade: 'B+',
    gpa: 3.67,
    description: 'Pass with Merit',
    marksRange: { min: 75, max: 79 },
  },
  {
    grade: 'B',
    gpa: 3.33,
    description: 'Pass with Merit',
    marksRange: { min: 70, max: 74 },
  },
  {
    grade: 'B-',
    gpa: 3.0,
    description: 'Pass',
    marksRange: { min: 65, max: 69 },
  },
  {
    grade: 'C+',
    gpa: 2.67,
    description: 'Pass',
    marksRange: { min: 60, max: 64 },
  },
  {
    grade: 'C',
    gpa: 2.33,
    description: 'Pass',
    marksRange: { min: 55, max: 59 },
  },
  {
    grade: 'C-',
    gpa: 2.0,
    description: 'Pass',
    marksRange: { min: 50, max: 54 },
  },
  {
    grade: 'PP',
    gpa: 0.0,
    description: 'Pass Provisional',
    marksRange: { min: 45, max: 49 },
  },
  {
    grade: 'F',
    gpa: 0.0,
    description: 'Fail',
    marksRange: { min: 0, max: 49 },
  },
  {
    grade: 'EXP',
    gpa: null,
    description: 'Exempted',
  },
  {
    grade: 'PC',
    gpa: 2.0,
    description: 'Pass Conceded',
  },
  {
    grade: 'PX',
    gpa: 2.0,
    description: 'Pass (supplementary work submitted)',
  },
  {
    grade: 'AP',
    gpa: 2.0,
    description: 'Aegrotat Pass',
  },
  {
    grade: 'X',
    gpa: 0.0,
    description: 'Outstanding Supplementary Assessment',
  },
  {
    grade: 'Def',
    gpa: null,
    description: 'Deferred',
  },
  {
    grade: 'GNS',
    gpa: 0.0,
    description: 'Grade Not Submitted',
  },
  {
    grade: 'ANN',
    gpa: 0.0,
    description: 'Result Annulled Due To Misconduct',
  },
  {
    grade: 'FIN',
    gpa: 0.0,
    description: 'Fail Incomplete',
  },
  {
    grade: 'FX',
    gpa: 0.0,
    description: 'Fail (supplementary work submitted)',
  },
  {
    grade: 'DNC',
    gpa: 0.0,
    description: 'Did Not Complete',
  },
  {
    grade: 'DNA',
    gpa: 0.0,
    description: 'Did Not Attend',
  },
  {
    grade: 'PP',
    gpa: 0.0,
    description: 'Pending',
  },
  {
    grade: 'DNS',
    gpa: 0.0,
    description: 'Did Not Submit',
  },
  {
    grade: 'NM',
    gpa: null,
    description: 'No Mark',
  },
];

export function normalizeGradeSymbol(grade: string): string {
  return grade.trim().toUpperCase();
}

export function getGradeBySymbol(grade: string): GradeDefinition | undefined {
  return grades.find((g) => g.grade === normalizeGradeSymbol(grade));
}

export function getGradeByMarks(marks: number): GradeDefinition | undefined {
  return grades.find(
    (g) =>
      g.marksRange && marks >= g.marksRange.min && marks <= g.marksRange.max,
  );
}

export function getGradesByGPA(gpa: number): GradeDefinition[] {
  return grades.filter((g) => g.gpa === gpa);
}

export function getLetterGrade(marks: number): (typeof gradeEnum)[number] {
  const gradeDefinition = getGradeByMarks(marks);
  return gradeDefinition?.grade || 'F';
}

export function getGradePoints(grade: string): number {
  const gradeDefinition = getGradeBySymbol(grade);
  return gradeDefinition?.gpa ?? 0;
}

export function isFailingGrade(grade: string): boolean {
  return ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
    normalizeGradeSymbol(grade),
  );
}

export function isPassingGrade(grade: string): boolean {
  const passingGrades = grades
    .filter((g) => g.gpa !== null && g.gpa > 0)
    .map((g) => g.grade as string);
  return passingGrades.includes(normalizeGradeSymbol(grade));
}

export function isSupplementaryGrade(grade: string): boolean {
  return normalizeGradeSymbol(grade) === 'PP';
}

export function isFailingOrSupGrade(grade: string): boolean {
  return isFailingGrade(grade) || isSupplementaryGrade(grade);
}

export function getMarksRangeString(grade: string): string {
  const gradeDefinition = getGradeBySymbol(grade);
  if (!gradeDefinition?.marksRange) return '';
  return `${gradeDefinition.marksRange.min}-${gradeDefinition.marksRange.max}`;
}

export function getAllGrades(): Array<{
  grade: string;
  marksRange: string;
  gpa: number | null;
  description: string;
}> {
  return grades.map((g) => ({
    grade: g.grade,
    marksRange: g.marksRange ? `${g.marksRange.min}-${g.marksRange.max}` : '',
    gpa: g.gpa,
    description: g.description,
  }));
}

export type ModuleSummaryInput = {
  grade: string;
  credits: number;
  status?: StudentModuleStatus;
};

export function summarizeModules(modules: ModuleSummaryInput[]) {
  const relevant = modules.filter(
    (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
  );
  let points = 0;
  let creditsAttempted = 0;
  let creditsForGPA = 0;
  const creditsCompleted = relevant.reduce((sum, m) => {
    const normalizedGrade = normalizeGradeSymbol(m.grade);
    if (normalizedGrade === 'NM' || normalizedGrade === '') {
      return sum;
    }
    const gradePoints = getGradePoints(m.grade);
    return gradePoints > 0 ? sum + m.credits : sum;
  }, 0);
  relevant.forEach((m) => {
    const normalizedGrade = normalizeGradeSymbol(m.grade);
    const gradePoints = getGradePoints(m.grade);
    const gradeDefinition = getGradeBySymbol(m.grade);
    creditsAttempted += m.credits;
    if (normalizedGrade !== 'NM' && normalizedGrade !== '') {
      creditsForGPA += m.credits;
      if (gradeDefinition && gradeDefinition.gpa !== null) {
        points += gradePoints * m.credits;
      }
    }
  });
  return {
    points,
    creditsAttempted,
    creditsCompleted,
    gpa: calculateGPA(points, creditsForGPA),
    isNoMarks: false,
  };
}

export function calculateGPA(points: number, creditsForGPA: number) {
  return creditsForGPA > 0 ? points / creditsForGPA : 0;
}

interface Module {
  code: string;
  name: string;
}

interface SemesterModule {
  credits: number;
  module?: Module | null;
}

interface StudentModule {
  id: number;
  semesterModuleId: number;
  semesterModule: SemesterModule;
  grade: string;
  status: StudentModuleStatus;
  marks: string;
}

export function calculateSemesterGPA(studentModules: StudentModule[]) {
  if (!studentModules || studentModules.length === 0)
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };

  try {
    const modules: ModuleSummaryInput[] = studentModules
      .filter((sm) => sm && sm.semesterModule && sm.grade != null)
      .map((sm) => ({
        grade: sm.grade || 'NM',
        credits: Math.max(0, sm.semesterModule?.credits || 0),
        status: sm.status,
      }));

    if (modules.length === 0) {
      return { gpa: 0, totalCredits: 0, qualityPoints: 0 };
    }

    const summary = summarizeModules(modules);

    return {
      gpa: Math.round((summary.gpa || 0) * 100) / 100,
      totalCredits: summary.creditsCompleted || 0,
      qualityPoints: summary.points || 0,
    };
  } catch (error) {
    console.error('Error calculating semester GPA:', error);
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };
  }
}

export function getCumulativeGPA(programs: Program[]) {
  const { studentModules } = extractData(programs);
  try {
    const allModules: ModuleSummaryInput[] = [];

    if (!programs || programs.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    studentModules.forEach((sm) => {
      allModules.push({
        grade: sm.grade || 'NM',
        credits: Math.max(0, sm.semesterModule?.credits || 0),
        status: sm.status,
      });
    });

    if (allModules.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    const summary = summarizeModules(allModules);

    return {
      gpa: Math.round((summary.gpa || 0) * 100) / 100,
      totalCredits: summary.creditsCompleted || 0,
      totalCreditsAttempted: summary.creditsAttempted || 0,
      qualityPoints: summary.points || 0,
    };
  } catch (error) {
    console.error('Error calculating cumulative GPA:', error);
    return {
      gpa: 0,
      totalCredits: 0,
      totalCreditsAttempted: 0,
      qualityPoints: 0,
    };
  }
}

export type FacultyRemarksResult = {
  status: 'Proceed' | 'Remain in Semester' | 'No Marks';
  failedModules: {
    code: string;
    name: string;
  }[];
  supplementaryModules: {
    code: string;
    name: string;
  }[];
  message: string;
  details: string;
};

export function getAcademicRemarks(programs: Program[]): FacultyRemarksResult {
  const { semesters, studentModules } = extractData(programs);

  if (studentModules.some((m) => m.grade === 'NM')) {
    return {
      status: 'No Marks',
      failedModules: [],
      supplementaryModules: [],
      message: 'No Marks',
      details: 'One or more modules have no marks captured',
    };
  }

  const latestFailedModules = semesters[0].studentModules.filter((m) =>
    isFailingGrade(m.grade),
  );
  const failedModules = studentModules.filter((m) => {
    if (!isFailingOrSupGrade(m.grade)) return false;

    const hasPassedLater = studentModules.some(
      (otherModule) =>
        otherModule.semesterModule.module.name ===
          m.semesterModule.module.name &&
        otherModule.id !== m.id &&
        isPassingGrade(otherModule.grade),
    );

    return !hasPassedLater;
  });

  const supplementary = studentModules.filter((m) =>
    isSupplementaryGrade(m.grade),
  );

  const remainInSemester = latestFailedModules.length >= 3;
  const status = remainInSemester ? 'Remain in Semester' : 'Proceed';

  const messageParts: string[] = [status];

  if (supplementary.length > 0) {
    messageParts.push(
      `must supplement ${supplementary.map((m) => m.semesterModule.module.name).join(', ')}`,
    );
  }
  if (failedModules.length > 0) {
    messageParts.push(
      `must repeat ${failedModules.map((m) => m.semesterModule.module.name).join(', ')}`,
    );
  }

  const message = messageParts.join(', ');

  let details = '';
  if (remainInSemester) {
    details = `Failed ${latestFailedModules.length} modules in latest semester`;
  } else {
    details = 'Student is eligible to proceed';
  }

  return {
    status,
    failedModules: failedModules.map((m) => ({
      code: m.semesterModule.module.code,
      name: m.semesterModule.module.name,
    })),
    supplementaryModules: supplementary.map((m) => ({
      code: m.semesterModule.module.code,
      name: m.semesterModule.module.name,
    })),
    message,
    details,
  };
}

function extractData(programs: Program[]) {
  const activePrograms = programs.filter((p) => p.status === 'Active');
  if (activePrograms.length > 1) {
    throw new Error('Multiple active programs found');
  }
  const semesters = activePrograms[0].semesters || [];
  const filtered = [...semesters]
    .sort((a, b) => b.id - a.id)
    .filter((s) => !['Deleted', 'Deferred', 'DroppedOut'].includes(s.status));

  const studentModules = filtered
    .flatMap((s) => s.studentModules)
    .filter((m) => !['Delete', 'Drop'].includes(m.status));

  return {
    semesters: filtered,
    studentModules,
  };
}
