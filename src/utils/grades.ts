import { gradeEnum, ModuleStatus } from '@/db/schema';

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
  status?: ModuleStatus;
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

export type ModuleForRemarks = {
  code: string;
  name: string;
  grade: string;
  credits: number;
  status?: ModuleStatus;
  semesterNumber: number;
  semesterModuleId?: number;
};

export type SemesterModuleData = {
  modules: ModuleForRemarks[];
  semesterNumber: number;
};

export type FacultyRemarksResult = {
  status: 'Proceed' | 'Remain in Semester';
  failedModules: {
    code: string;
    name: string;
    semesterNumber: number;
  }[];
  supplementaryModules: {
    code: string;
    name: string;
    semesterNumber: number;
  }[];
  message: string;
  details: string;
};

export function calculateFacultyRemarks(
  currentSemesterModules: (ModuleSummaryInput & {
    code: string;
    name: string;
  })[],
  historicalSemesters: SemesterModuleData[] = [],
  nextSemesterNumber?: number,
): FacultyRemarksResult {
  const relevantCurrentModules = currentSemesterModules.filter(
    (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
  );
  const hasNoMarks = relevantCurrentModules.some(
    (m) => normalizeGradeSymbol(m.grade) === 'NM',
  );
  if (hasNoMarks) {
    return {
      status: 'Proceed',
      failedModules: [],
      supplementaryModules: [],
      message: 'No Marks',
      details: 'One or more modules have no marks submitted',
    };
  }
  const currentFailedModules = relevantCurrentModules.filter((m) =>
    isFailingGrade(m.grade),
  );
  const currentSupplementaryModules = relevantCurrentModules.filter((m) =>
    isSupplementaryGrade(m.grade),
  );
  const historicalFailures: ModuleForRemarks[] = [];
  const allHistoricalFailures: ModuleForRemarks[] = [];

  if (historicalSemesters.length > 0 && nextSemesterNumber) {
    const nextSemesterParity = nextSemesterNumber % 2;
    historicalSemesters.forEach((semesterData) => {
      const semesterParity = semesterData.semesterNumber % 2;

      semesterData.modules.forEach((module) => {
        if (
          isFailingGrade(module.grade) &&
          !['Delete', 'Drop'].includes(module.status ?? '')
        ) {
          const hasBeenRepeated =
            historicalSemesters.some((otherSemester) =>
              otherSemester.modules.some(
                (otherModule) =>
                  otherModule.name === module.name &&
                  !isFailingGrade(otherModule.grade) &&
                  !['Delete', 'Drop'].includes(otherModule.status ?? ''),
              ),
            ) ||
            relevantCurrentModules.some(
              (currentModule) =>
                currentModule.name === module.name &&
                !isFailingGrade(currentModule.grade) &&
                !['Delete', 'Drop'].includes(currentModule.status ?? ''),
            );

          if (!hasBeenRepeated) {
            allHistoricalFailures.push(module);

            if (
              semesterParity === nextSemesterParity &&
              semesterData.semesterNumber < nextSemesterNumber
            ) {
              historicalFailures.push(module);
            }
          }
        }
      });
    });
  }
  const shouldRemainInSemester = currentFailedModules.length >= 3;
  const status = shouldRemainInSemester ? 'Remain in Semester' : 'Proceed';
  const messageParts: string[] = [status];
  if (currentSupplementaryModules.length > 0) {
    const supplementaryCodes = currentSupplementaryModules.map((m) => m.code);
    messageParts.push(`must supplement ${supplementaryCodes.join(', ')}`);
  }
  const allFailedModules = [
    ...currentFailedModules.map((m) => ({
      code: m.code,
      name: m.name,
      semesterNumber: 0,
    })),
    ...allHistoricalFailures
      .filter((h) => !currentFailedModules.some((c) => c.name === h.name))
      .map((m) => ({
        code: m.code,
        name: m.name,
        semesterNumber: m.semesterNumber,
      })),
  ].filter(
    (module, index, self) =>
      index === self.findIndex((m) => m.code === module.code),
  );
  if (allFailedModules.length > 0) {
    const failedCodes = allFailedModules.map((m) => m.code);
    messageParts.push(`must repeat ${failedCodes.join(', ')}`);
  }
  const message = messageParts.join(', ');
  let details = '';
  if (shouldRemainInSemester) {
    details = `Failed ${currentFailedModules.length} modules in current semester`;
  } else {
    details = 'Student is eligible to proceed';
  }
  return {
    status,
    failedModules: allFailedModules,
    supplementaryModules: currentSupplementaryModules.map((m) => ({
      code: m.code,
      name: m.name,
      semesterNumber: 0,
    })),
    message,
    details,
  };
}

export function getSimpleFacultyRemarks(
  modules: (ModuleSummaryInput & { code: string; name: string })[],
): string {
  const relevantModules = modules.filter(
    (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
  );
  const hasNoMarks = relevantModules.some(
    (m) => normalizeGradeSymbol(m.grade) === 'NM',
  );
  if (hasNoMarks) {
    return 'No Marks';
  }
  const failedModules = relevantModules.filter((m) => isFailingGrade(m.grade));
  const supplementaryModules = relevantModules.filter((m) =>
    isSupplementaryGrade(m.grade),
  );
  const shouldRemainInSemester = failedModules.length >= 3;
  const baseStatus = shouldRemainInSemester ? 'Remain in Semester' : 'Proceed';
  const messageParts: string[] = [baseStatus];
  if (supplementaryModules.length > 0) {
    const supplementaryCodes = supplementaryModules.map((m) => m.code);
    messageParts.push(`must supplement ${supplementaryCodes.join(', ')}`);
  }
  if (failedModules.length > 0) {
    const failedCodes = failedModules.map((m) => m.code);
    messageParts.push(`must repeat ${failedCodes.join(', ')}`);
  }
  return messageParts.join(', ');
}
