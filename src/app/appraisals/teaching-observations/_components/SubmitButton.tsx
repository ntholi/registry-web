'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import {
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import { submitObservation } from '../_server/actions';

type SubmitButtonProps = {
	observationId: string;
};

export default function SubmitButton({ observationId }: SubmitButtonProps) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const mutation = useMutation({
		mutationFn: () => submitObservation(observationId),
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
				title: 'Submitted',
				message: 'Observation submitted successfully',
				color: 'green',
			});
			router.refresh();
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
		<Button
			leftSection={<IconSend size={16} />}
			color='blue'
			onClick={() => mutation.mutate()}
			loading={mutation.isPending}
		>
			Submit
		</Button>
	);
}
