'use server';

import { db } from '@/db';
import { students } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getRepeatModules,
  getSemesterModules,
} from '@/app/(main)/(auth)/registration/request/actions';

export type ModuleResult = {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: string;
  prerequisites?: { moduleCode: string; prerequisiteCode: string }[];
};

export async function getStudentModules(
  stdNo: number,
  queryType: 'semester' | 'repeat',
): Promise<ModuleResult[]> {
  const student = await db.query.students.findFirst({
    where: eq(students.stdNo, stdNo),
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (!student.structureId) {
    throw new Error('Student has no structure assigned');
  }

  if (queryType === 'semester') {
    return getSemesterModules(stdNo, student.sem + 1, student.structureId);
  } else {
    return getRepeatModules(stdNo, student.sem + 1);
  }
}
