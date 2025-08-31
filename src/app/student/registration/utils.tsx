import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  IconCheck,
  IconClock,
  IconExclamationCircle,
} from '@tabler/icons-react';

type Status = 'pending' | 'approved' | 'rejected' | 'partial' | 'registered';

export function getStatusIcon(status: Status) {
  switch (status) {
    case 'approved':
      return <IconCheck size='1rem' />;
    case 'rejected':
      return <IconExclamationCircle size='1rem' />;
    case 'registered':
      return <IconCheck size='1rem' />;
    case 'partial':
      return <IconClock size='1rem' />;
    case 'pending':
    default:
      return <IconClock size='1rem' />;
  }
}

export function getStatusColor(status: Status) {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'registered':
      return 'green';
    case 'partial':
      return 'orange';
    default:
      return 'yellow';
  }
}

export function getOverallClearanceStatus(registration: {
  clearances: { clearance: { status: Status } }[];
  status: Status;
}) {
  if (!registration.clearances || registration.clearances.length === 0) {
    return 'pending';
  }

  const anyRejected = registration.clearances.some(
    (c) => c.clearance.status === 'rejected'
  );
  if (anyRejected) return 'rejected';

  const allApproved = registration.clearances.every(
    (c) => c.clearance.status === 'approved'
  );
  if (allApproved) return 'approved';

  return registration.status;
}
