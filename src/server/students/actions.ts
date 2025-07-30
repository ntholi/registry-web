'use server';

import { students } from '@/db/schema';
import { QueryOptions } from '../base/BaseRepository';
import { studentsService as service } from './service';
import { revalidatePath } from 'next/cache';

type Student = typeof students.$inferInsert;

export interface StudentFilter {
  schoolId?: number;
  programId?: number;
  termId?: number;
  semesterNumber?: number;
}

type StudentQueryParams = Omit<QueryOptions<typeof students>, 'filter'> & {
  filter?: StudentFilter;
};

export async function getStudent(stdNo: number) {
  return service.get(stdNo);
}

export async function getAcademicHistory(stdNo: number) {
  return service.getAcademicHistory(stdNo);
}

export async function getStudentByUserId(userId: string | undefined | null) {
  if (!userId) return;
  return service.findStudentByUserId(userId);
}

export async function getAllPrograms() {
  return service.getAllPrograms();
}

export async function getProgramsBySchoolId(schoolId: number) {
  return service.getProgramsBySchoolId(schoolId);
}

export async function getStudentsByModuleId(moduleId: number) {
  return service.findByModuleId(moduleId);
}

export async function getStudentRegistrationData(stdNo: number) {
  return service.getRegistrationData(stdNo);
}

export async function findAllStudents(
  page: number = 1,
  search = '',
  filter?: StudentFilter
) {
  const params: StudentQueryParams = {
    page,
    search,
    searchColumns: ['stdNo', 'name'],
  };
  if (filter) {
    params.filter = filter;
  }
  return service.findAll(
    params as QueryOptions<typeof students> & { filter?: StudentFilter }
  );
}

export async function createStudent(student: Student) {
  return service.create(student);
}

export async function updateStudent(stdNo: number, student: Student) {
  return service.update(stdNo, student);
}

export async function deleteStudent(stdNo: number) {
  return service.delete(stdNo);
}

export async function updateStudentUserId(
  stdNo: number,
  userId: string | null
) {
  const res = service.updateUserId(stdNo, userId);
  revalidatePath(`/dashboard/students/${stdNo}`);
  return res;
}

export async function updateStudentProgramStructure(
  stdNo: number,
  structureId: number
) {
  const res = await service.updateProgramStructure(stdNo, structureId);
  revalidatePath(`/dashboard/students/${stdNo}`);
  return res;
}

export async function getStudentPhoto(
  studentNumber: number | undefined | null
): Promise<string | null> {
  if (!studentNumber) return null;
  try {
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      const fileName = `${studentNumber}.${ext}`;
      const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/${fileName}`;

      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (error) {
        console.error('Error:', error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking student photo:', error);
    return null;
  }
}
