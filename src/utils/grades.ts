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

/**
 * Get a grade definition by its grade symbol
 * @param grade The grade symbol to look up
 * @returns The complete grade definition or undefined if not found
 */
export function getGradeBySymbol(grade: string): GradeDefinition | undefined {
  return grades.find((g) => g.grade === normalizeGradeSymbol(grade));
}

/**
 * Get a grade definition for the given marks
 * @param marks The marks to get a grade for
 * @returns The grade definition or undefined if no matching range is found
 */
export function getGradeByMarks(marks: number): GradeDefinition | undefined {
  return grades.find(
    (g) =>
      g.marksRange && marks >= g.marksRange.min && marks <= g.marksRange.max,
  );
}

/**
 * Get a grade definition by its GPA value
 * @param gpa The GPA value to look up
 * @returns The grade definition(s) matching the GPA value or empty array if none found
 */
export function getGradesByGPA(gpa: number): GradeDefinition[] {
  return grades.filter((g) => g.gpa === gpa);
}

/**
 * Get the letter grade symbol for a given marks percentage
 * @param marks Marks percentage (0-100)
 * @returns The grade symbol as a string
 */
export function getLetterGrade(marks: number): (typeof gradeEnum)[number] {
  const gradeDefinition = getGradeByMarks(marks);
  return gradeDefinition?.grade || 'F';
}

/**
 * Get the GPA value for a grade symbol
 * @param grade The grade symbol to look up
 * @returns The GPA value or 0 if the grade is not found
 */
export function getGradePoints(grade: string): number {
  const gradeDefinition = getGradeBySymbol(grade);
  return gradeDefinition?.gpa ?? 0;
}

/**
 * Check if a grade is considered a failing grade
 * @param grade The grade symbol to check
 * @returns True if the grade is a failing grade, false otherwise
 */
export function isFailingGrade(grade: string): boolean {
  return ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
    normalizeGradeSymbol(grade),
  );
}

/**
 * Check if a grade is considered a supplementary grade
 * @param grade The grade symbol to check
 * @returns True if the grade is a supplementary grade, false otherwise
 */
export function isSupplementaryGrade(grade: string): boolean {
  return normalizeGradeSymbol(grade) === 'PP';
}

/**
 * Get the marks range for a grade as a formatted string (e.g., "90-100")
 * @param grade The grade symbol to look up
 * @returns The formatted marks range or empty string if no range is defined
 */
export function getMarksRangeString(grade: string): string {
  const gradeDefinition = getGradeBySymbol(grade);

  if (!gradeDefinition?.marksRange) return '';

  return `${gradeDefinition.marksRange.min}-${gradeDefinition.marksRange.max}`;
}

/**
 * Get all information about grades in a structured format
 * @returns An array of objects containing grade information
 */
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

/**
 * Extract semester number from term string (e.g., "Semester 1" -> 1)
 */
function extractSemesterNumber(term: string): number {
  const match = term.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Calculate faculty remarks for a student based on current and historical semester data
 * @param currentSemesterModules Modules from the current semester
 * @param historicalSemesters All previous semester data for the student
 * @param nextSemesterNumber The upcoming semester number
 * @returns Faculty remarks result with status and detailed breakdown
 */
export function calculateFacultyRemarks(
  currentSemesterModules: (ModuleSummaryInput & {
    code: string;
    name: string;
  })[],
  historicalSemesters: SemesterModuleData[] = [],
  nextSemesterNumber?: number,
): FacultyRemarksResult {
  // Filter out deleted/dropped modules
  const relevantCurrentModules = currentSemesterModules.filter(
    (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
  );

  // Count current semester failures
  const currentFailedModules = relevantCurrentModules.filter((m) =>
    isFailingGrade(m.grade),
  );

  // Count current semester supplementary modules
  const currentSupplementaryModules = relevantCurrentModules.filter((m) =>
    isSupplementaryGrade(m.grade),
  );

  let historicalFailures: ModuleForRemarks[] = [];

  // If we have historical data and next semester number, check for matching parity failures
  if (historicalSemesters.length > 0 && nextSemesterNumber) {
    const nextSemesterParity = nextSemesterNumber % 2;

    // Get all unrepeated failures from matching parity semesters
    historicalSemesters.forEach((semesterData) => {
      const semesterParity = semesterData.semesterNumber % 2;

      if (
        semesterParity === nextSemesterParity &&
        semesterData.semesterNumber < nextSemesterNumber
      ) {
        semesterData.modules.forEach((module) => {
          if (
            isFailingGrade(module.grade) &&
            !['Delete', 'Drop'].includes(module.status ?? '')
          ) {
            // Check if this module was repeated successfully in a later semester
            const hasBeenRepeated = historicalSemesters.some(
              (laterSemester) =>
                laterSemester.semesterNumber > semesterData.semesterNumber &&
                laterSemester.modules.some(
                  (laterModule) =>
                    laterModule.semesterModuleId === module.semesterModuleId &&
                    !isFailingGrade(laterModule.grade) &&
                    !['Delete', 'Drop'].includes(laterModule.status ?? ''),
                ),
            );

            if (!hasBeenRepeated) {
              historicalFailures.push(module);
            }
          }
        });
      }
    });
  }

  // Determine if student should remain in semester
  const shouldRemainInSemester =
    currentFailedModules.length >= 3 || historicalFailures.length >= 3;

  const status = shouldRemainInSemester ? 'Remain in Semester' : 'Proceed';

  // Build the message
  let messageParts: string[] = [status];

  // Add supplementary requirements
  if (currentSupplementaryModules.length > 0) {
    const supplementaryCodes = currentSupplementaryModules.map((m) => m.code);
    messageParts.push(`must supplement ${supplementaryCodes.join(', ')}`);
  }

  // Add repeat requirements (current failures + historical failures)
  const allFailedModules = [
    ...currentFailedModules.map((m) => ({
      code: m.code,
      name: m.name,
      semesterNumber: 0,
    })),
    ...historicalFailures.map((m) => ({
      code: m.code,
      name: m.name,
      semesterNumber: m.semesterNumber,
    })),
  ];

  if (allFailedModules.length > 0) {
    const failedCodes = allFailedModules.map((m) => m.code);
    messageParts.push(`must repeat ${failedCodes.join(', ')}`);
  }

  const message = messageParts.join(', ');

  // Build details explanation
  let details = '';
  if (shouldRemainInSemester) {
    if (currentFailedModules.length >= 3) {
      details = `Failed ${currentFailedModules.length} modules in current semester`;
    } else {
      const parityType =
        nextSemesterNumber && nextSemesterNumber % 2 === 1 ? 'odd' : 'even';
      details = `Failed ${historicalFailures.length} unrepeated modules from ${parityType} semesters`;
    }
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

/**
 * Simple faculty remarks calculation for current semester only
 * This is the function that worksheet.ts should use
 * @param modules Current semester modules with grades
 * @returns Simple faculty remark message
 */
export function getSimpleFacultyRemarks(
  modules: (ModuleSummaryInput & { code: string; name: string })[],
): string {
  const relevantModules = modules.filter(
    (m) => !['Delete', 'Drop'].includes(m.status ?? ''),
  );

  const failedModules = relevantModules.filter((m) => isFailingGrade(m.grade));
  const supplementaryModules = relevantModules.filter((m) =>
    isSupplementaryGrade(m.grade),
  );

  // Check if student should remain in semester (3+ failures)
  const shouldRemainInSemester = failedModules.length >= 3;
  const baseStatus = shouldRemainInSemester ? 'Remain in Semester' : 'Proceed';

  const messageParts: string[] = [baseStatus];

  // Add supplementary requirements
  if (supplementaryModules.length > 0) {
    const supplementaryCodes = supplementaryModules.map((m) => m.code);
    messageParts.push(`must supplement ${supplementaryCodes.join(', ')}`);
  }

  // Add repeat requirements
  if (failedModules.length > 0) {
    const failedCodes = failedModules.map((m) => m.code);
    messageParts.push(`must repeat ${failedCodes.join(', ')}`);
  }

  return messageParts.join(', ');
}
