'use server';

import { db } from '@/db';
import { studentSemesters, studentPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
  const program = await db.query.studentPrograms.findFirst({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        where: eq(studentSemesters.status, 'Active'),
        with: {
          modules: true,
        },
      },
    },
  });

  if (!program)
    return {
      cgpa: 0,
      creditsEarned: 0,
      requiredCredits: 0,
    };

  const semesterMap = new Map<
    string,
    {
      totalPoints: number;
      totalCredits: number;
      earnedCredits: number;
    }
  >();

  let cumulativePoints = 0;
  let requiredCredits = 0;

  for (const sem of program.semesters) {
    for (const mod of sem.modules) {
      const points = gradePoints[mod.grade as keyof typeof gradePoints] || 0;
      const term = sem.term;

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
        semester.earnedCredits += mod.credits;
        cumulativePoints += points * mod.credits;
      }
      requiredCredits += mod.credits;
    }
  }

  return {
    cgpa: requiredCredits > 0 ? cumulativePoints / requiredCredits : 0,
    creditsEarned: cumulativePoints,
    requiredCredits,
  };
}
