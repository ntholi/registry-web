'use server';

import { fortinetRegistrationService } from './service';
import { fortinetLevelEnum } from '@/db/schema';

type FortinetLevel = (typeof fortinetLevelEnum)[number];

export async function getFortinetRegistrationById(id: number) {
  return fortinetRegistrationService.getById(id);
}

export async function getFortinetRegistrationsByStudentNumber(stdNo: number) {
  return fortinetRegistrationService.getByStudentNumber(stdNo);
}

export async function getCurrentStudentFortinetRegistrations() {
  return fortinetRegistrationService.getForCurrentStudent();
}

export async function getFortinetRegistrationsForSchool(
  schoolId: number,
  page: number = 1,
  search?: string
) {
  return fortinetRegistrationService.getForSchool(schoolId, {
    page,
    search,
  });
}

export async function createFortinetRegistration(data: {
  level: FortinetLevel;
  message?: string;
}) {
  return fortinetRegistrationService.create(data);
}

export async function updateFortinetRegistrationStatus(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'completed',
  message?: string
) {
  return fortinetRegistrationService.updateStatus(id, status, message);
}

export async function deleteFortinetRegistration(id: number) {
  return fortinetRegistrationService.delete(id);
}

export async function getAllFortinetRegistrations(
  page: number = 1,
  search?: string
) {
  return fortinetRegistrationService.getAll({ page, search });
}

export async function getFortinetRegistrationCount() {
  return fortinetRegistrationService.count();
}
