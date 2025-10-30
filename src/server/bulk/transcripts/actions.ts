'use server';

import { bulkService as service } from './service';

export async function getDistinctGraduationDates() {
  return service.getDistinctGraduationDates();
}

export async function getStudentsByGraduationDate(graduationDate: string) {
  return service.getStudentsByGraduationDate(graduationDate);
}
