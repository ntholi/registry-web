'use server';

import { db } from '@/db';
import { semesters } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function getSemesterModules(
  structureId: number,
  semester: number
) {
  const result = await db.query.semesters.findFirst({
    where: and(
      eq(semesters.structureId, structureId),
      eq(semesters.semesterNumber, semester)
    ),
    with: {
      semesterModules: {
        with: {
          module: true,
        },
      },
    },
  });

  return result?.semesterModules.map((semesterModule) => semesterModule.module);
}
