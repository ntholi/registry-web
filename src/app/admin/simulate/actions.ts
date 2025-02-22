'use server';

import { getStudentSemesterModules } from '@/app/(main)/(auth)/registration/request/actions';
import { db } from '@/db';
import { students } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStudentModules(stdNo: number) {
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

  const semester = await getStudentSemesterModules(stdNo, student.structureId);

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
    modules: semester.modules,
    semesterStatus: semester.semesterStatus,
    semesterNo: semester.semesterNo,
  };
}
