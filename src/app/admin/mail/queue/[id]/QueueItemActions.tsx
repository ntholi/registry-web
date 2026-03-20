'use client';

import { Button, Group, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import {
	cancelQueuedEmail,
	retryFailedEmail,
} from '../../queues/_server/actions';

type Props = {
	id: number;
	status: string;
};

export default function QueueItemActions({ id, status }: Props) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const { mutate: retry, isPending: isRetrying } = useActionMutation(
		(queueId: number) => retryFailedEmail(queueId),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Retry Queued',
					message: 'The email has been re-queued for sending.',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['mail-queue'] });
				router.refresh();
			},
		}
	);

	const { mutate: cancel, isPending: isCancelling } = useActionMutation(
		(queueId: number) => cancelQueuedEmail(queueId),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Cancelled',
					message: 'The queued email has been cancelled.',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['mail-queue'] });
				router.push('/admin/mail/queue');
			},
		}
	);

	function handleCancel() {
		modals.openConfirmModal({
			title: 'Cancel Queued Email',
			children: (
				<Text size='sm'>
					Are you sure you want to cancel this queued email? This action cannot
					be undone.
				</Text>
			),
			labels: { confirm: 'Cancel Email', cancel: 'Keep' },
			confirmProps: { color: 'red' },
			onConfirm: () => cancel(id),
		});
	}

	if (status !== 'failed' && status !== 'pending') return null;

	return (
		<Group mt='md'>
			{status === 'failed' && (
				<Button
					variant='light'
					color='orange'
					onClick={() => retry(id)}
					loading={isRetrying}
				>
					Retry
				</Button>
			)}
			{status === 'pending' && (
				<Button
					variant='light'
					color='red'
					onClick={handleCancel}
					loading={isCancelling}
				>
					Cancel
				</Button>
			)}
		</Group>
	);
}
