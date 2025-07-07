'use server';

import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { getCurrentTerm } from '@/server/terms/actions';
import { and, eq, inArray, ne, notInArray } from 'drizzle-orm';

export async function getTranscript(stdNo: number) {
  const { name } = await getCurrentTerm();
  const programs = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      inArray(studentPrograms.status, ['Active', 'Completed']),
    ),
    with: {
      structure: {
        with: {
          program: true,
        },
      },
      semesters: {
        where: (semester) =>
          and(
            notInArray(semester.status, ['Deleted', 'Deferred', 'DroppedOut']),
            ne(semester.term, name),
          ),
        with: {
          studentModules: {
            where: (module) => notInArray(module.status, ['Delete', 'Drop']),
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

  return programs.map((program) => ({
    id: program.id,
    code: program.structure.program.code,
    name: program.structure.program.name,
    semesters: program.semesters.map((semester) => ({
      id: semester.id,
      term: semester.term,
      status: semester.status,
      modules: semester.studentModules.map((stdModule) => ({
        id: stdModule.id,
        code: stdModule.semesterModule.module!.code,
        name: stdModule.semesterModule.module!.name,
        type: stdModule.semesterModule.type,
        status: stdModule.status,
        marks: stdModule.marks,
        grade: stdModule.grade,
        credits: stdModule.semesterModule.credits,
      })),
    })),
  }));
}
