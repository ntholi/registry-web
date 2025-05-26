'use server';

import { getStudentSemesterModules } from '@/app/(main)/(auth)/registration/request/actions';
import { db } from '@/db';
import { studentPrograms, students } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStudentModules(stdNo: number) {
  const student = await db.query.students.findFirst({
    where: eq(students.stdNo, stdNo),
    with: {
      programs: {
        where: eq(studentPrograms.status, 'Active'),
        orderBy: (programs, { asc }) => [asc(programs.id)],
        limit: 1,
        with: {
          structure: {
            with: {
              program: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const structure = student.programs.at(0)?.structure;
  if (!structure?.id) {
    throw new Error('Student has no structure assigned');
  }

  const semester = await getStudentSemesterModules(stdNo, structure.id);

  return {
    student: {
      name: student.name,
      stdNo: student.stdNo,
      semester: student.sem,
      program: {
        structureCode: structure.code,
        name: structure?.program.name,
        code: structure?.program.code,
      },
    },
    modules: semester.modules,
    semesterStatus: semester.semesterStatus,
    semesterNo: semester.semesterNo,
  };
}
