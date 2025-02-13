'use server';

import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getFailedModules(stdNo: number, semester: number) {
  const studentModules = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        where: (semesters) => eq(semesters.semesterNumber, semester),
        with: {
          studentModules: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  const failedModules = studentModules
    .flatMap((prog) => prog.semesters)
    .flatMap((sem) => sem.studentModules)
    .filter((mod) => parseFloat(mod.marks) < 50)
    .map((mod) => ({
      code: mod.module.code,
      name: mod.module.name,
      marks: mod.marks,
    }));

  return failedModules;
}
