'use server';

import { db } from '@/db';
import { and, eq, notInArray } from 'drizzle-orm';
import {
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';

import { getGradePoints, getGradeBySymbol } from '@/utils/grades';

export async function getStudentScore(stdNo: number) {
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
    if (getGradeBySymbol(stdModule.grade)?.gpa !== null) {
      const points = getGradePoints(stdModule.grade);
      if (points > 0) {
        totalPoints += points * stdModule.semesterModule.credits;
        totalCredits += stdModule.semesterModule.credits;
        creditsCompleted += stdModule.semesterModule.credits;
      }
    }
  });

  const semesters = await db.query.structureSemesters.findMany({
    where: eq(structureSemesters.structureId, program.structureId),
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
