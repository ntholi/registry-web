import {
  IconCircleCheck,
  IconClock,
  IconExclamationCircle,
} from '@tabler/icons-react';

type Status = 'pending' | 'approved' | 'rejected' | 'confirmed';

export function getStatusIcon(status: Status) {
  switch (status) {
    case 'approved':
      return <IconCircleCheck size='1rem' />;
    case 'rejected':
      return <IconExclamationCircle size='1rem' />;
    case 'confirmed':
      return <IconCircleCheck size='1rem' />;
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
    case 'confirmed':
      return 'green';
    default:
      return 'yellow';
  }
}

export function getOverallClearanceStatus(graduation: {
  graduationClearances: { clearance: { status: Status } }[];
}) {
  if (
    !graduation.graduationClearances ||
    graduation.graduationClearances.length === 0
  ) {
    return 'pending';
  }

  const anyRejected = graduation.graduationClearances.some(
    (c) => c.clearance.status === 'rejected'
  );
  if (anyRejected) return 'rejected';

  const allApproved = graduation.graduationClearances.every(
    (c) => c.clearance.status === 'approved'
  );
  if (allApproved) return 'approved';

  return 'pending';
}

export function getGraduationStatus(graduation: {
  informationConfirmed: boolean;
  graduationClearances?: { clearance: { status: Status } }[];
}) {
  const clearanceStatus = graduation.graduationClearances
    ? getOverallClearanceStatus({
        graduationClearances: graduation.graduationClearances,
      })
    : 'pending';

  // If all clearances are approved and information is confirmed, graduation is complete
  if (clearanceStatus === 'approved' && graduation.informationConfirmed) {
    return 'approved';
  }

  // If any clearance is rejected, graduation is rejected
  if (clearanceStatus === 'rejected') {
    return 'rejected';
  }

  // If information is confirmed but clearances are pending
  if (graduation.informationConfirmed && clearanceStatus === 'pending') {
    return 'pending';
  }

  // If information is not confirmed
  if (!graduation.informationConfirmed) {
    return 'pending';
  }

  return 'pending';
}
