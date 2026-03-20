'use client';

import { Button, Select, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { setPrimaryMailAccount } from '../accounts/_server/actions';

type Account = {
	id: string;
	email: string;
	displayName: string | null;
	isPrimary: boolean;
	isActive: boolean;
};

type Props = {
	accounts: Account[];
	currentId: string | null;
};

export default function ChangePrimaryButton({ accounts, currentId }: Props) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [_selected, _setSelected] = useState<string | null>(null);

	const { mutate, isPending } = useActionMutation(
		(id: string) => setPrimaryMailAccount(id),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Primary Updated',
					message: 'Primary account has been changed.',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
				modals.closeAll();
				router.refresh();
			},
		}
	);

	function handleClick() {
		modals.open({
			title: 'Change Primary Account',
			children: (
				<Stack>
					<Text size='sm'>
						Select the account to use as the primary sender.
					</Text>
					<PrimarySelect
						accounts={accounts.filter((a) => a.isActive && a.id !== currentId)}
						onConfirm={(id) => mutate(id)}
						isPending={isPending}
					/>
				</Stack>
			),
		});
	}

	return (
		<Button variant='light' size='compact-sm' onClick={handleClick}>
			Change Primary
		</Button>
	);
}

type PrimarySelectProps = {
	accounts: Account[];
	onConfirm: (id: string) => void;
	isPending: boolean;
};

function PrimarySelect({ accounts, onConfirm, isPending }: PrimarySelectProps) {
	const [value, setValue] = useState<string | null>(null);

	return (
		<Stack>
			<Select
				data={accounts.map((a) => ({
					value: a.id,
					label: `${a.email}${a.displayName ? ` (${a.displayName})` : ''}`,
				}))}
				value={value}
				onChange={setValue}
				placeholder='Select an account'
			/>
			<Button
				onClick={() => value && onConfirm(value)}
				loading={isPending}
				disabled={!value}
			>
				Confirm
			</Button>
		</Stack>
	);
}
