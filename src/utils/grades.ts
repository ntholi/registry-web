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

  const creditsCompleted = relevant.reduce((sum, m) => {
    const gradePoints = getGradePoints(m.grade);
    return gradePoints > 0 ? sum + m.credits : sum;
  }, 0);

  relevant.forEach((m) => {
    const gradePoints = getGradePoints(m.grade);
    const gradeDefinition = getGradeBySymbol(m.grade);

    if (gradeDefinition && gradeDefinition.gpa !== null) {
      points += gradePoints * m.credits;
      creditsAttempted += m.credits;
    }
  });

  return {
    points,
    creditsAttempted,
    creditsCompleted,
    gpa: calculateGPA(points, creditsAttempted),
  };
}

export function calculateGPA(points: number, attemptedCredits: number) {
  return attemptedCredits > 0 ? points / attemptedCredits : 0;
}
