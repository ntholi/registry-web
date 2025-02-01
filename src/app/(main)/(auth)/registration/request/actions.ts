'use server';

import { db } from '@/db';
import { structureSemesters } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function getSemesterModules(
  structureId: number,
  semester: number
) {
  const result = await db.query.structureSemesters.findFirst({
    where: and(
      eq(structureSemesters.structureId, structureId),
      eq(structureSemesters.semesterNumber, semester)
    ),
    with: {
      semesterModules: {
        with: {
          module: true,
        },
      },
    },
  });

  return (
    result?.semesterModules.map((semesterModule) => semesterModule.module) || []
  );
}
