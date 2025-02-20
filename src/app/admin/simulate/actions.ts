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

export type ModuleQueryResponse = {
  student: {
    name: string;
    stdNo: number;
    semester: number;
    program: {
      structureCode?: string;
      name?: string;
      code?: string;
    };
  };
  modules: ModuleResult[];
};

export async function getStudentModules(
  stdNo: number,
  queryType: 'semester' | 'repeat',
): Promise<ModuleQueryResponse> {
  const student = await db.query.students.findFirst({
    where: eq(students.stdNo, stdNo),
    with: {
      structure: {
        with: {
          program: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (!student.structureId) {
    throw new Error('Student has no structure assigned');
  }

  const modules =
    queryType === 'semester'
      ? await getSemesterModules(stdNo, student.sem + 1, student.structureId)
      : await getRepeatModules(stdNo, student.sem + 1);

  return {
    student: {
      name: student.name,
      stdNo: student.stdNo,
      semester: student.sem,
      program: {
        structureCode: student.structure?.code,
        name: student.structure?.program.name,
        code: student.structure?.program.code,
      },
    },
    modules,
  };
}
