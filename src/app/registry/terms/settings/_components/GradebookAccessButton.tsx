'use client';

import { Switch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { updateGradebookAccess } from '../_server/actions';

interface Props {
	termId: number;
	access: boolean;
}

export default function GradebookAccessButton({ termId, access }: Props) {
	const queryClient = useQueryClient();

	const mutation = useActionMutation(
		(newAccess: boolean) => updateGradebookAccess(termId, newAccess),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Success',
					message: 'Gradebook access updated',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['term-settings', termId] });
			},
			onError: (error: Error) => {
				notifications.show({
					title: 'Error',
					message: error.message,
					color: 'red',
				});
			},
		}
	);

	return (
		<Switch
			checked={access}
			onChange={(e) => mutation.mutate(e.currentTarget.checked)}
			disabled={mutation.isPending}
			color='green'
			label={access ? 'Open' : 'Closed'}
		/>
	);
}
