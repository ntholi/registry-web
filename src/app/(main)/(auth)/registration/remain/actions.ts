'use server';

import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';

export async function getFailedModules(stdNo: number, semester: number) {
  const studentModules = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      semesters: {
        where: (s) =>
          and(
            eq(s.semesterNumber, semester),
            notInArray(s.status, ['Deleted', 'Deferred']),
          ),
        with: {
          studentModules: {
            where: (m) => notInArray(m.status, ['Delete', 'Drop']),
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

  const allModules = studentModules
    .flatMap((prog) => prog.semesters)
    .flatMap((sem) => sem.studentModules);

  const passedModules = allModules
    .filter((mod) => parseFloat(mod.marks) >= 50)
    .map((mod) => mod.semesterModule.module?.name);

  const failedModules = allModules
    .filter((mod) => !passedModules.includes(mod.semesterModule.module?.name))
    .map((mod) => ({
      code: mod.semesterModule.module?.code,
      name: mod.semesterModule.module?.name,
      marks: mod.marks,
    }));

  const uniqueFailedModules = Array.from(
    new Map(failedModules.map((item) => [item.code, item])).values(),
  );

  return uniqueFailedModules;
}
