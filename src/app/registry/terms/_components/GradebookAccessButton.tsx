'use client';

import { Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGradebookAccess } from '../_server/settings-actions';

interface Props {
	termId: number;
	access: boolean;
}

export default function GradebookAccessButton({ termId, access }: Props) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (newAccess: boolean) =>
			updateGradebookAccess(termId, newAccess),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Gradebook access updated',
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
			title: access ? 'Close Gradebook Access' : 'Open Gradebook Access',
			centered: true,
			children: (
				<Stack gap='sm'>
					<Text size='sm'>
						{access
							? 'This will prevent lecturers from accessing and editing grades.'
							: 'This will allow lecturers to access and edit grades.'}
					</Text>
				</Stack>
			),
			labels: {
				confirm: access ? 'Close Access' : 'Open Access',
				cancel: 'Cancel',
			},
			confirmProps: { color: access ? 'red' : 'green' },
			onConfirm: () => mutation.mutate(!access),
		});
	};

	return (
		<Button
			color={access ? 'green' : 'gray'}
			variant={access ? 'filled' : 'light'}
			onClick={openModal}
			loading={mutation.isPending}
		>
			{access ? 'Gradebook Open' : 'Gradebook Closed'}
		</Button>
	);
}
