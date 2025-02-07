'use server';

import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

export async function getTranscript(stdNo: number) {
  const programs = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      inArray(studentPrograms.status, ['Active', 'Completed'])
    ),
    with: {
      semesters: {
        where: (semester) =>
          notInArray(semester.status, ['Deleted', 'Deferred']),
        with: {
          modules: true,
        },
      },
    },
  });

  return programs.map((program) => ({
    id: program.id,
    code: program.code,
    name: program.name,
    semesters: program.semesters.map((semester) => ({
      id: semester.id,
      term: semester.term,
      status: semester.status,
      modules: semester.modules.map((module) => ({
        id: module.id,
        code: module.code,
        name: module.name,
        type: module.type,
        status: module.status,
        marks: module.marks,
        grade: module.grade,
        credits: module.credits,
      })),
    })),
  }));
}
