import {
  IconCircleCheck,
  IconClock,
  IconExclamationCircle,
} from '@tabler/icons-react';

export type BaseStatus = 'pending' | 'approved' | 'rejected' | 'confirmed';
export type RegistrationStatus = BaseStatus | 'partial' | 'registered';
export type GraduationStatus = BaseStatus;

export function getStatusIcon(status: RegistrationStatus | GraduationStatus) {
  switch (status) {
    case 'approved':
    case 'confirmed':
    case 'registered':
      return <IconCircleCheck size='1rem' />;
    case 'rejected':
      return <IconExclamationCircle size='1rem' />;
    case 'partial':
    case 'pending':
    default:
      return <IconClock size='1rem' />;
  }
}

export function getStatusColor(status: RegistrationStatus | GraduationStatus) {
  switch (status) {
    case 'approved':
    case 'confirmed':
    case 'registered':
      return 'green';
    case 'rejected':
      return 'red';
    case 'partial':
      return 'orange';
    case 'pending':
    default:
      return 'yellow';
  }
}

export function getClearanceStatus<T extends { clearance: { status: string } }>(
  clearances: T[] | undefined
): 'pending' | 'approved' | 'rejected' {
  if (!clearances || clearances.length === 0) {
    return 'pending';
  }

  const anyRejected = clearances.some((c) => c.clearance.status === 'rejected');
  if (anyRejected) return 'rejected';

  const allApproved = clearances.every(
    (c) => c.clearance.status === 'approved'
  );
  if (allApproved) return 'approved';

  return 'pending';
}

export function getGraduationStatus(graduation: {
  informationConfirmed: boolean;
  graduationClearances?: { clearance: { status: GraduationStatus } }[];
}) {
  const clearanceStatus = graduation.graduationClearances
    ? getClearanceStatus(graduation.graduationClearances)
    : 'pending';
  if (clearanceStatus === 'approved' && graduation.informationConfirmed) {
    return 'approved';
  }
  if (clearanceStatus === 'rejected') {
    return 'rejected';
  }
  if (graduation.informationConfirmed && clearanceStatus === 'pending') {
    return 'pending';
  }
  if (!graduation.informationConfirmed) {
    return 'pending';
  }

  return 'pending';
}

export function getRegistrationOverallClearanceStatus(registration: {
  clearances: { clearance: { status: RegistrationStatus } }[];
  status: RegistrationStatus;
}) {
  const baseStatus = getClearanceStatus(registration.clearances);
  if (baseStatus === 'approved' && registration.status === 'registered') {
    return 'registered';
  }
  if (baseStatus === 'pending' && registration.status === 'partial') {
    return 'partial';
  }

  return baseStatus as RegistrationStatus;
}
