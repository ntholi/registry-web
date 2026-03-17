'use client';

import { Button, Modal, Stack, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import { acknowledgeObservation } from '../_server/actions';

type AcknowledgeButtonProps = {
	observationId: string;
	onAcknowledged?: () => void;
};

export default function AcknowledgeButton({
	observationId,
	onAcknowledged,
}: AcknowledgeButtonProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [comment, setComment] = useState('');
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => acknowledgeObservation(observationId, comment || null),
		onSuccess: async (data) => {
			if (isActionResult(data) && !data.success) {
				notifications.show({
					title: 'Error',
					message: getActionErrorMessage(data.error),
					color: 'red',
				});
				return;
			}
			await queryClient.invalidateQueries({
				queryKey: ['teaching-observations'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Observation acknowledged',
				color: 'green',
			});
			close();
			onAcknowledged?.();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				leftSection={<IconCheck size={16} />}
				color='green'
				onClick={open}
			>
				Acknowledge
			</Button>
			<Modal opened={opened} onClose={close} title='Acknowledge Observation'>
				<Stack>
					<Textarea
						label='Comment (optional)'
						placeholder='Add a comment...'
						autosize
						minRows={3}
						value={comment}
						onChange={(e) => setComment(e.currentTarget.value)}
					/>
					<Button
						onClick={() => mutation.mutate()}
						loading={mutation.isPending}
						color='green'
					>
						Confirm Acknowledgment
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
