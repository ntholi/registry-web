import { Badge, Skeleton } from '@mantine/core';
import { Suspense } from 'react';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  getRegistrationOverallClearanceStatus as getOverallClearanceStatus,
  getStatusColor,
  type RegistrationStatus,
} from '../../utils/status';

interface Props {
  requestId: number;
  status: RegistrationStatus;
}

type Status = RegistrationStatus;

async function StatusValue({ requestId, status }: Props) {
  let value = status;
  if (value === 'pending') {
    const registration = await getRegistrationRequest(requestId);
    if (registration && 'clearances' in registration) {
      value = getOverallClearanceStatus(registration);
    }
  }
  return (
    <Badge color={getStatusColor(value)} variant='light' size='sm'>
      {value}
    </Badge>
  );
}

export default function StatusBadge({ requestId, status }: Props) {
  return (
    <Suspense fallback={<Skeleton height={22} width={80} radius='sm' />}>
      <StatusValue requestId={requestId} status={status} />
    </Suspense>
  );
}
