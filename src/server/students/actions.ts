'use server';

import { students } from '@/db/schema';
import { studentsService as service } from './service';

type Student = typeof students.$inferInsert;

export interface StudentFilter {
  schoolId?: number;
  programId?: number;
  termId?: number;
  semesterNumber?: number;
}

export async function getStudent(stdNo: number) {
  return service.get(stdNo);
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

export async function findAllStudents(
  page: number = 1,
  search = '',
  filter?: StudentFilter,
) {
  const params: any = { page, search, searchColumns: ['stdNo', 'name'] };
  if (filter) {
    params.filter = filter;
  }
  return service.findAll(params);
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
  userId: string | null,
) {
  return service.updateUserId(stdNo, userId);
}
