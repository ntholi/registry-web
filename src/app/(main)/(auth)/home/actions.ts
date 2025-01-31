'use server';

import { db } from '@/db';
import { students, studentSemesters } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

const gradePoints = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  D: 1.0,
  F: 0.0,
} as const;

export async function getStudentScore(stdNo: number) {
  const modules = await db.query.studentModules.findMany({
    where: and(
      eq(students.stdNo, stdNo),
      eq(studentSemesters.status, 'Active')
    ),
    with: {
      semester: {
        columns: { term: true },
      },
    },
  });

  const semesterMap = new Map<
    string,
    {
      totalPoints: number;
      totalCredits: number;
      earnedCredits: number;
    }
  >();

  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  for (const mod of modules) {
    const points = gradePoints[mod.grade as keyof typeof gradePoints] || 0;
    const term = mod.semester.term;

    if (!semesterMap.has(term)) {
      semesterMap.set(term, {
        totalPoints: 0,
        totalCredits: 0,
        earnedCredits: 0,
      });
    }

    const semester = semesterMap.get(term)!;
    semester.totalPoints += points * mod.credits;
    semester.totalCredits += mod.credits;

    if (points >= 1.0) {
      // Passing grade
      semester.earnedCredits += mod.credits;
      cumulativePoints += points * mod.credits;
    }
    cumulativeCredits += mod.credits;
  }

  return {
    cgpa: cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0,
    creditsEarned: cumulativePoints,
    cumulativeCredits,
  };
}
