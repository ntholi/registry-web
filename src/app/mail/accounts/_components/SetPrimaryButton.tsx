'use client';

import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { setPrimaryMailAccount } from '../../accounts/_server/actions';

type Props = {
	accountId: string;
};

export default function SetPrimaryButton({ accountId }: Props) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { mutate, isPending } = useActionMutation(
		(id: string) => setPrimaryMailAccount(id),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Primary Updated',
					message: 'This account is now the primary sender.',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
				router.refresh();
			},
		}
	);

	function handleClick() {
		modals.openConfirmModal({
			title: 'Set as Primary',
			children: (
				<Text size='sm'>
					This will make this account the primary sender for all system emails.
					The current primary account will be unset.
				</Text>
			),
			labels: { confirm: 'Set as Primary', cancel: 'Cancel' },
			onConfirm: () => mutate(accountId),
		});
	}

	return (
		<Button
			variant='light'
			size='compact-sm'
			onClick={handleClick}
			loading={isPending}
		>
			Set as Primary
		</Button>
	);
}
