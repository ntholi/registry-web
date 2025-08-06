'use server';

import {
  StudentModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import { AcademicRemarks, Student } from '@/lib/helpers/students';
import { registrationRequestsService as service } from './service';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

export async function getRegistrationRequest(id: number) {
  return service.get(id);
}

export async function getRegistrationRequestByStdNo(
  stdNo: number,
  termId: number
) {
  return service.getByStdNo(stdNo, termId);
}

export async function getRequestedModules(registrationRequestId: number) {
  return service.getRequestedModules(registrationRequestId);
}

export async function countByStatus(
  status: 'pending' | 'registered' | 'rejected' | 'approved'
) {
  return service.countByStatus(status);
}

export async function findAllRegistrationRequests(
  page = 1,
  search = '',
  status?: 'pending' | 'registered' | 'rejected' | 'approved',
  termId?: number
) {
  return service.findByStatus(
    status ?? 'pending',
    {
      page,
      search,
    },
    termId
  );
}

export async function getStudentSemesterModules(
  student: Student,
  remarks: AcademicRemarks
) {
  return service.getStudentSemesterModules(student, remarks);
}

export async function determineSemesterStatus(
  modules: ModuleWithStatus[],
  student: Student
) {
  const semesterNo = commonSemesterNo(modules);
  const completedSemesters =
    student?.programs
      .flatMap((program) => program.semesters)
      .map((semester) => semester.semesterNumber)
      .filter((semesterNo): semesterNo is number => semesterNo !== null) ?? [];

  const hasCompletedSemester = completedSemesters.includes(semesterNo);

  return {
    semesterNo: semesterNo,
    status: (hasCompletedSemester ? 'Repeat' : 'Active') as 'Active' | 'Repeat',
  };
}

export async function createRegistrationRequest(value: RegistrationRequest) {
  return service.create(value);
}

export async function updateRegistrationRequest({
  id,
  status,
  message,
}: {
  id: number;
  status: RegistrationRequest['status'];
  message?: string;
}) {
  return service.update(id, { status, message });
}

export async function deleteRegistrationRequest(id: number) {
  return service.delete(id);
}

export async function createRequestedModules(
  stdNo: number,
  modules: RequestedModule[]
) {
  return service.createRequestedModules(stdNo, modules);
}

export async function createRegistrationWithModules(data: {
  stdNo: number;
  modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
  sponsorId: number;
  semesterNumber: number;
  semesterStatus: 'Active' | 'Repeat';
  termId: number;
  borrowerNo?: string;
}) {
  return service.createRegistrationWithModules(data);
}

export async function updateRegistrationWithModules(
  registrationRequestId: number,
  modules: { id: number; status: StudentModuleStatus }[],
  semesterNumber?: number,
  semesterStatus?: 'Active' | 'Repeat'
) {
  return service.updateRegistrationWithModules(
    registrationRequestId,
    modules,
    semesterNumber,
    semesterStatus
  );
}

export async function updateRegistrationWithModulesAndSponsorship(
  registrationRequestId: number,
  modules: { id: number; status: StudentModuleStatus }[],
  sponsorshipData: {
    sponsorId: number;
    borrowerNo?: string;
    bankName?: string;
    accountNumber?: string;
  },
  semesterNumber?: number,
  semesterStatus?: 'Active' | 'Repeat'
) {
  return service.updateRegistrationWithModulesAndSponsorship(
    registrationRequestId,
    modules,
    sponsorshipData,
    semesterNumber,
    semesterStatus
  );
}

export async function getStudentRegistrationHistory(stdNo: number) {
  return service.getHistory(stdNo);
}

function commonSemesterNo(modules: ModuleWithStatus[]): number {
  const semesterCounts = new Map<number, number>();

  for (const m of modules) {
    const count = semesterCounts.get(m.semesterNo) || 0;
    semesterCounts.set(m.semesterNo, count + 1);
  }

  let mostCommonSemester = modules[0]?.semesterNo || 1;
  let maxCount = 0;

  for (const [semesterNo, count] of semesterCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonSemester = semesterNo;
    }
  }

  return mostCommonSemester;
}
