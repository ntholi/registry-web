'use client';

import { Badge, Skeleton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getRegistrationRequest } from '@/modules/registry/features/registration-requests/server/requests/actions';
import {
	getRegistrationOverallClearanceStatus as getOverallClearanceStatus,
	getStatusColor,
	type RegistrationStatus,
} from '@/modules/student-portal/features/utils/components/status';

interface Props {
	requestId: number;
	status: RegistrationStatus;
}

export default function StatusBadge({ requestId, status }: Props) {
	const { data: registration, isLoading } = useQuery({
		queryKey: ['registration-request', requestId],
		queryFn: () => getRegistrationRequest(requestId),
		enabled: status === 'pending',
		staleTime: Infinity,
	});

	let displayValue = status;
	if (status === 'pending' && registration && 'clearances' in registration) {
		displayValue = getOverallClearanceStatus(registration);
	}

	if (isLoading) {
		return <Skeleton height={22} width={80} radius='sm' />;
	}

	return (
		<Badge color={getStatusColor(displayValue)} variant='light' size='sm'>
			{displayValue}
		</Badge>
	);
}
