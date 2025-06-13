'use server';

import { db } from '@/db';
import { and, eq, notInArray } from 'drizzle-orm';
import {
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';

import { summarizeModules } from '@/utils/grades';

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

  const summary = summarizeModules(program.semesters);

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
    gpa: Number(summary.gpa.toFixed(2)),
    creditsCompleted: summary.creditsCompleted,
    creditsRequired,
  };
}
