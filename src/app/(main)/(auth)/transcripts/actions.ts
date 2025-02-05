'use server';

import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getTranscript(stdNo: number) {
  const programs = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
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
