'use server';

import { db } from '@/db';
import {
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';

const grades = {
  'A+': 4.0,
  A: 4.0,
  'A-': 4.0,
  'B+': 3.67,
  B: 3.33,
  'B-': 3.0,
  'C+': 2.67,
  C: 2.33,
  'C-': 2.0,
  F: 0.0,
  PC: 2.0,
  PX: 2.0,
  AP: 2.0,
  X: 0.0,
  GNS: 0.0,
  ANN: 0.0,
  FIN: 0.0,
  FX: 0.0,
  DNC: 0.0,
  DNA: 0.0,
  PP: 0.0,
  DNS: 0.0,
};

const gradeValues = Object.keys(grades) as Array<keyof typeof grades>;

function isValidGrade(grade: string): grade is keyof typeof grades {
  return gradeValues.includes(grade as keyof typeof grades);
}

function getPoints(grade: keyof typeof grades): number {
  const points = grades[grade];
  if (points) return points;

  return 0;
}

export async function getStudentScore(stdNo: number, structureId: number) {
  const program = await db.query.studentPrograms.findFirst({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      semesters: {
        where: notInArray(studentSemesters.status, [
          'Deleted',
          'DroppedOut',
          'Deferred',
          'Inactive',
        ]),
        with: {
          studentModules: {
            with: {
              semesterModule: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!program?.semesters.length) {
    return {
      gpa: 0,
      creditsCompleted: 0,
      creditsRequired: 0,
    };
  }

  const modules = program.semesters.flatMap(
    (semester) => semester.studentModules,
  );
  let totalPoints = 0;
  let totalCredits = 0;
  let creditsCompleted = 0;

  modules.forEach((stdModule) => {
    if (isValidGrade(stdModule.grade)) {
      const points = getPoints(stdModule.grade);
      if (points > 0) {
        totalPoints += points * stdModule.semesterModule.credits;
        totalCredits += stdModule.semesterModule.credits;
        creditsCompleted += stdModule.semesterModule.credits;
      }
    }
  });

  const semesters = await db.query.structureSemesters.findMany({
    where: eq(structureSemesters.structureId, structureId),
    with: {
      semesterModules: true,
    },
  });

  const creditsRequired = semesters
    .flatMap((it) => it.semesterModules)
    .reduce((sum, it) => sum + it.credits, 0);

  return {
    gpa: totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0,
    creditsCompleted,
    creditsRequired,
  };
}
