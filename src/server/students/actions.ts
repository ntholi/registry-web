'use server';

import { students } from '@/db/schema';
import { studentsService as service } from './service';

type Student = typeof students.$inferInsert;

export async function getStudent(stdNo: number) {
  return service.get(stdNo);
}

export async function getStudentByUserId(userId: string | undefined | null) {
  if (!userId) return;
  return service.findStudentByUserId(userId);
}

export async function getStudentsBySemesterModuleId(semesterModuleId: number) {
  return service.findStudentsBySemesterModuleId(semesterModuleId);
}

export async function findAllStudents(page: number = 1, search = '') {
  return service.findAll({ page, search, searchColumns: ['stdNo', 'name'] });
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
