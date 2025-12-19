'use client';

import { Alert, Box, Divider, Stack, Text } from '@mantine/core';
import type { getRegistrationRequest } from '@registry/registration';
import { getAlertColor } from '@student-portal/utils';
import { IconExclamationCircle, IconInfoCircle } from '@tabler/icons-react';
import { toTitleCase } from '@/shared/lib/utils/utils';

type Props = {
	registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function DepartmentMessagesView({ registration }: Props) {
	const { clearances = [] } = registration;

	const rejectedClearances = clearances.filter(
		(c) => c.clearance.status === 'rejected'
	);

	if (rejectedClearances.length === 0 && registration.message) {
		return (
			<>
				<Divider my='sm' />
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					color={getAlertColor('info')}
					variant='light'
					title='Message'
				>
					{registration.message}
				</Alert>
			</>
		);
	}

	if (rejectedClearances.length === 0) return null;

	const rejectingDepartments = rejectedClearances
		.map((r) => r.clearance.department)
		.filter(Boolean) as string[];

	const title =
		rejectingDepartments.length === 0
			? 'Rejected'
			: `Rejected by ${rejectingDepartments.map(toTitleCase).join(' and ')}`;

	return (
		<>
			<Divider my='sm' />
			<Alert
				icon={<IconExclamationCircle size='1rem' />}
				color={getAlertColor('error')}
				variant='outline'
				title={title}
			>
				<Stack gap='xs'>
					{rejectedClearances.map((clearanceMapping) => {
						const { clearance } = clearanceMapping;
						return (
							<Box key={clearance.id}>
								{clearance.message ? (
									<Text size='sm'>{clearance.message}</Text>
								) : (
									<Text size='sm' c='dimmed' fs='italic'>
										Rejected without specific message.
									</Text>
								)}
								{rejectedClearances.length > 1 &&
									clearanceMapping !==
										rejectedClearances[rejectedClearances.length - 1] && (
										<Divider mt='sm' />
									)}
							</Box>
						);
					})}
				</Stack>
			</Alert>
		</>
	);
}
