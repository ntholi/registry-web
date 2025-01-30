'use server';

import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export async function getSemesterModules(stdNo: number, semester: number) {
  return db.query.semesterModules.findMany({
    where: and(
      eq(semesterModules.stdNo, stdNo),
      eq(semesterModules.semester, semester)
    ),
  });
}
