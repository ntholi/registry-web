'use client';

import { Group, Paper, Stack, Switch, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconCheck,
	IconExclamationCircle,
	IconLock,
	IconLockOpen,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import { authClient } from '@/core/auth-client';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { getAlertColor, getBooleanColor } from '@/shared/lib/utils/colors';
import { updateBlockedStudent } from '../_server/actions';

type Props = {
	id: number;
	currentStatus: 'blocked' | 'unblocked';
	byDepartment: string;
	stdNo: string | number;
	studentName: string;
};

export default function StudentStatusSwitch({
	id,
	currentStatus,
	byDepartment,
	stdNo,
	studentName,
}: Props) {
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [status, setStatus] = useState<'blocked' | 'unblocked'>(currentStatus);
	const canUpdate =
		session?.user?.role === 'admin' || session?.user?.role === byDepartment;

	useEffect(() => {
		setStatus(currentStatus);
	}, [currentStatus]);

	const mutation = useActionMutation(
		(newStatus: 'blocked' | 'unblocked') =>
			updateBlockedStudent(id, { status: newStatus }),
		{
			onSuccess: (_, newStatus) => {
				queryClient.invalidateQueries({ queryKey: ['blocked-students'] });
				queryClient.invalidateQueries({ queryKey: ['blocked-student', id] });
				notifications.show({
					title: 'Status Updated',
					message: `Student ${stdNo} has been ${newStatus}`,
					color: getBooleanColor(newStatus === 'blocked', 'negative'),
					icon: <IconCheck size='1rem' />,
				});
			},
			onError: (error) => {
				setStatus((prev) => (prev === 'blocked' ? 'unblocked' : 'blocked'));
				notifications.show({
					title: 'Error',
					message: 'Failed to update student status. Please try again.',
					color: getAlertColor('error'),
					icon: <IconExclamationCircle size='1rem' />,
				});
				console.error('Failed to update student status:', error);
			},
		}
	);

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.currentTarget.checked;
		const newStatus = checked ? 'unblocked' : 'blocked';

		if (!canUpdate) {
			return;
		}

		setStatus(newStatus);

		mutation.mutate(newStatus);
	};

	const isBlocked = status === 'blocked';

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Group justify='space-between' align='center'>
					<Group gap='sm'>
						{isBlocked ? (
							<IconLock size='1.2rem' color='red' />
						) : (
							<IconLockOpen size='1.2rem' color='green' />
						)}
						<Stack gap={2}>
							<Title order={6} c={getBooleanColor(isBlocked, 'negative')}>
								Student Status
							</Title>
							<Text size='xs' c='dimmed'>
								{studentName} ({stdNo})
							</Text>
						</Stack>
					</Group>
					<Switch
						checked={!isBlocked}
						onChange={handleStatusChange}
						disabled={mutation.isPending || !canUpdate}
						size='lg'
						color='green'
						thumbIcon={
							!isBlocked ? (
								<IconLockOpen size='0.8rem' color='green' stroke={3} />
							) : (
								<IconLock size='0.8rem' color='red' stroke={3} />
							)
						}
						onLabel={
							<Text size='xs' fw={600} p={'xs'} c='green'>
								Active
							</Text>
						}
						offLabel={
							<Text size='xs' fw={600} p={'xs'} c='red'>
								Blocked
							</Text>
						}
					/>
				</Group>
				<Text size='sm' c='dimmed' ta='center'>
					{canUpdate
						? `Toggle to ${isBlocked ? 'unblock' : 'block'} this student's access`
						: 'Only the department that created this record can update it'}
				</Text>
			</Stack>
		</Paper>
	);
}
