import { Grade, gradeEnum, StudentModuleStatus } from '@/db/schema';
import { Program, StudentModule } from './type';

export type GradeDefinition = {
  grade: (typeof gradeEnum)[number];
  points: number | null;
  description: string;
  marksRange?: {
    min: number;
    max: number;
  };
};

export const grades: GradeDefinition[] = [
  {
    grade: 'A+',
    points: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 90, max: 100 },
  },
  {
    grade: 'A',
    points: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 85, max: 89 },
  },
  {
    grade: 'A-',
    points: 4.0,
    description: 'Pass with Distinction',
    marksRange: { min: 80, max: 84 },
  },
  {
    grade: 'B+',
    points: 3.67,
    description: 'Pass with Merit',
    marksRange: { min: 75, max: 79 },
  },
  {
    grade: 'B',
    points: 3.33,
    description: 'Pass with Merit',
    marksRange: { min: 70, max: 74 },
  },
  {
    grade: 'B-',
    points: 3.0,
    description: 'Pass',
    marksRange: { min: 65, max: 69 },
  },
  {
    grade: 'C+',
    points: 2.67,
    description: 'Pass',
    marksRange: { min: 60, max: 64 },
  },
  {
    grade: 'C',
    points: 2.33,
    description: 'Pass',
    marksRange: { min: 55, max: 59 },
  },
  {
    grade: 'C-',
    points: 2.0,
    description: 'Pass',
    marksRange: { min: 50, max: 54 },
  },
  {
    grade: 'PP',
    points: 0.0,
    description: 'Pass Provisional',
    marksRange: { min: 45, max: 49 },
  },
  {
    grade: 'F',
    points: 0.0,
    description: 'Fail',
    marksRange: { min: 0, max: 49 },
  },
  {
    grade: 'EXP',
    points: null,
    description: 'Exempted',
  },
  {
    grade: 'PC',
    points: 2.0,
    description: 'Pass Conceded',
  },
  {
    grade: 'PX',
    points: 2.0,
    description: 'Pass (supplementary work submitted)',
  },
  {
    grade: 'AP',
    points: 2.0,
    description: 'Aegrotat Pass',
  },
  {
    grade: 'X',
    points: 0.0,
    description: 'Outstanding Supplementary Assessment',
  },
  {
    grade: 'Def',
    points: null,
    description: 'Deferred',
  },
  {
    grade: 'GNS',
    points: 0.0,
    description: 'Grade Not Submitted',
  },
  {
    grade: 'ANN',
    points: 0.0,
    description: 'Result Annulled Due To Misconduct',
  },
  {
    grade: 'FIN',
    points: 0.0,
    description: 'Fail Incomplete',
  },
  {
    grade: 'FX',
    points: 0.0,
    description: 'Fail (supplementary work submitted)',
  },
  {
    grade: 'DNC',
    points: 0.0,
    description: 'Did Not Complete',
  },
  {
    grade: 'DNA',
    points: 0.0,
    description: 'Did Not Attend',
  },
  {
    grade: 'PP',
    points: 0.0,
    description: 'Pending',
  },
  {
    grade: 'DNS',
    points: 0.0,
    description: 'Did Not Submit',
  },
  {
    grade: 'NM',
    points: null,
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

export function getLetterGrade(marks: number): Grade {
  const gradeDefinition = getGradeByMarks(marks);
  return gradeDefinition?.grade || 'F';
}

export function getGradePoints(grade: string): number {
  const gradeDefinition = getGradeBySymbol(grade);
  return gradeDefinition?.points ?? 0;
}

export function isFailingGrade(grade: string): boolean {
  return ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
    normalizeGradeSymbol(grade),
  );
}

export function isPassingGrade(grade: string): boolean {
  const passingGrades = grades
    .filter((g) => g.points !== null && g.points > 0)
    .map((g) => g.grade as string);
  return passingGrades.includes(normalizeGradeSymbol(grade));
}

export function isSupplementaryGrade(grade: string): boolean {
  return normalizeGradeSymbol(grade) === 'PP';
}

export function isFailingOrSupGrade(grade: string): boolean {
  return isFailingGrade(grade) || isSupplementaryGrade(grade);
}

export function summarizeModules(modules: StudentModule[]) {
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
    return gradePoints > 0 ? sum + m.semesterModule.credits : sum;
  }, 0);
  relevant.forEach((m) => {
    const normalizedGrade = normalizeGradeSymbol(m.grade);
    const gradePoints = getGradePoints(m.grade);
    const gradeDefinition = getGradeBySymbol(m.grade);
    creditsAttempted += m.semesterModule.credits;
    if (normalizedGrade !== 'NM' && normalizedGrade !== '') {
      creditsForGPA += m.semesterModule.credits;
      if (gradeDefinition && gradeDefinition.points !== null) {
        points += gradePoints * m.semesterModule.credits;
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

export function calculateSemesterGPA(studentModules: StudentModule[]) {
  if (!studentModules || studentModules.length === 0)
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };

  try {
    const validModules = studentModules.filter(
      (sm) => sm && sm.semesterModule && sm.grade != null,
    );

    if (validModules.length === 0) {
      return { gpa: 0, totalCredits: 0, qualityPoints: 0 };
    }

    const summary = summarizeModules(validModules);

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
    if (!programs || programs.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    if (studentModules.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    const summary = summarizeModules(studentModules);

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
        otherModule.semesterModule.module?.name ===
          m.semesterModule.module?.name &&
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
      `must supplement ${supplementary.map((m) => m.semesterModule.module?.name).join(', ')}`,
    );
  }
  if (failedModules.length > 0) {
    messageParts.push(
      `must repeat ${failedModules.map((m) => m.semesterModule.module?.name).join(', ')}`,
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
      code: m.semesterModule.module?.code || '',
      name: m.semesterModule.module?.name || '',
    })),
    supplementaryModules: supplementary.map((m) => ({
      code: m.semesterModule.module?.code || '',
      name: m.semesterModule.module?.name || '',
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
