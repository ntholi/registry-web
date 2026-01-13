'use client';

import { Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveRejectedToBlocked } from '../_server/settings-actions';

interface Props {
	termId: number;
	termCode: string;
}

export default function MoveRejectedButton({ termId, termCode }: Props) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => moveRejectedToBlocked(termId),
		onSuccess: (result) => {
			notifications.show({
				title: 'Success',
				message: `Moved ${result.moved} students to blocked. Skipped ${result.skipped} already blocked.`,
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['terms'] });
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const openModal = () => {
		modals.openConfirmModal({
			title: 'Move Rejected to Blocked',
			centered: true,
			children: (
				<Stack gap='sm'>
					<Text size='sm'>
						This will move all students with rejected registration clearances
						for term <strong>{termCode}</strong> to blocked students.
					</Text>
					<Text size='sm' c='dimmed'>
						Rejection reasons from all departments will be combined. Students
						already blocked will be skipped.
					</Text>
				</Stack>
			),
			labels: { confirm: 'Move to Blocked', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => mutation.mutate(),
		});
	};

	return (
		<Button
			color='red'
			variant='light'
			onClick={openModal}
			loading={mutation.isPending}
		>
			Move Rejected to Blocked
		</Button>
	);
}
