'use server';

import { db } from '@/db';
import { studentSemesters, studentPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';

const gradePoints = {
  'A+': 4.0,
  A: 4.0,
  'A-': 4.0,
  'B+': 3.67,
  B: 3.33,
  'B-': 3.0,
  'C+': 2.67,
  C: 2.33,
  'C-': 2.0,
  PC: 2.0,
  PX: 2.0,
  AP: 2.0,
  X: 0,
  GNS: 0,
  ANN: 0,
  FIN: 0,
  FX: 0,
  DNC: 0,
  DNA: 0,
  PP: 0,
  DNS: 0,
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
