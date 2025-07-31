'use server';

import { registrationClearances, DashboardUser } from '@/db/schema';
import { registrationClearancesService as service } from './service';
import { auth } from '@/auth';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

export async function getRegistrationClearance(id: number) {
  return service.get(id);
}

export async function countPendingRegistrationClearances() {
  return service.countByStatus('pending');
}

export async function countApprovedRegistrationClearances() {
  return service.countByStatus('approved');
}

export async function countRejectedRegistrationClearances() {
  return service.countByStatus('rejected');
}

export async function registrationClearanceByDepartment(
  page: number = 1,
  search = ''
) {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      data: [],
      pages: 0,
    };
  }

  return service.findByDepartment(
    session.user.role as DashboardUser,
    {
      page,
      search,
    },
    'pending'
  );
}

export async function registrationClearanceByStatus(
  status: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  search = '',
  termId?: number
) {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      data: [],
      pages: 0,
    };
  }

  const res = await service.findByDepartment(
    session.user.role as DashboardUser,
    {
      page,
      search,
    },
    status,
    termId
  );

  return {
    items: res.items,
    totalPages: res.totalPages,
  };
}

export async function createRegistrationClearance(
  registrationClearance: RegistrationClearance
) {
  return service.respond(registrationClearance);
}

export async function updateRegistrationClearance(
  id: number,
  registrationClearance: RegistrationClearance
) {
  return service.update(id, registrationClearance);
}

export async function deleteRegistrationClearance(id: number) {
  return service.delete(id);
}

export async function getClearanceHistory(clearanceId: number) {
  return service.getHistory(clearanceId);
}

export async function getClearanceHistoryByStudentNo(stdNo: number) {
  return service.getHistoryByStudentNo(stdNo);
}

export async function getNextPendingRegistrationClearance() {
  const session = await auth();
  if (!session?.user?.role) {
    return null;
  }

  return service.findNextPending(session.user.role as DashboardUser);
}

export async function exportClearancesByStatus(
  status: 'pending' | 'approved' | 'rejected',
  termId?: number
) {
  const clearances = await service.findByStatusForExport(status, termId);

  const csvData = clearances.map((clearance) => {
    const student = clearance.registrationRequest.student;
    const activeProgram = student.programs[0];

    return {
      'Student Number': student.stdNo,
      'Student Name': student.name,
      Program: activeProgram?.structure.program.name || 'N/A',
      Department: clearance.department,
      Status: clearance.status,
      Term: clearance.registrationRequest.term.name,
      'Response Date': clearance.responseDate
        ? new Date(clearance.responseDate).toLocaleDateString()
        : 'N/A',
      'Responded By': clearance.respondedBy?.name || 'N/A',
      Message: clearance.message || 'N/A',
      'Created Date': clearance.createdAt
        ? new Date(clearance.createdAt).toLocaleDateString()
        : 'N/A',
    };
  });

  const headers = Object.keys(csvData[0] || {});
  const csvContent = [
    headers.join(','),
    ...csvData.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof typeof row];
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}
