'use server';

import { db } from '@/db';
import {
  structureSemesters,
  studentModules,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

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

export async function getRepeatModules(stdNo: number) {
  const allModules = await db.query.studentModules.findMany({
    where: eq(
      studentModules.studentSemesterId,
      db
        .select({ id: studentSemesters.id })
        .from(studentSemesters)
        .innerJoin(
          studentPrograms,
          eq(studentSemesters.studentProgramId, studentPrograms.id)
        )
        .where(eq(studentPrograms.stdNo, stdNo))
    ),
    columns: {
      code: true,
      name: true,
      marks: true,
      credits: true,
      type: true,
      status: true,
    },
  });

  const moduleResults = new Map<string, { failed: boolean; passed: boolean }>();

  for (const it of allModules) {
    const currentModule = moduleResults.get(it.name) || {
      failed: false,
      passed: false,
    };

    if (Number(it.marks) >= 50) {
      currentModule.passed = true;
    } else {
      currentModule.failed = true;
    }

    moduleResults.set(it.name, currentModule);
  }

  return allModules.filter((module) => {
    const result = moduleResults.get(module.name);
    return Number(module.marks) < 50 && !result?.passed;
  });
}
