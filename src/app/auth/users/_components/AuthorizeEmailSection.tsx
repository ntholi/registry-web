'use client';

import {
	deleteMailAccount,
	getMyMailAccounts,
} from '@mail/accounts/_server/actions';
import {
	ActionIcon,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconMail, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';

type MailAccount = {
	id: string;
	email: string;
	displayName: string | null;
	isPrimary: boolean;
	isActive: boolean;
	createdAt: Date;
};

export default function AuthorizeEmailSection() {
	const queryClient = useQueryClient();

	const { data: accounts = [], isLoading } = useQuery({
		queryKey: ['user-mail-accounts'],
		queryFn: () => getMyMailAccounts(),
	});

	const authorizeUrl = '/api/auth/gmail?returnUrl=/mail';

	return (
		<Stack gap='sm'>
			<Group justify='space-between'>
				<Text fw={600} size='sm'>
					Authorized Emails
				</Text>
				<Button
					component='a'
					href={authorizeUrl}
					size='xs'
					variant='light'
					leftSection={<IconPlus size={14} />}
				>
					Authorize Email
				</Button>
			</Group>

			{isLoading ? (
				<Text size='sm' c='dimmed'>
					Loading…
				</Text>
			) : accounts.length === 0 ? (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<IconMail size={32} opacity={0.3} />
						<Text size='sm' c='dimmed'>
							No emails authorized yet
						</Text>
					</Stack>
				</Paper>
			) : (
				<Stack gap='xs'>
					{accounts.map((account) => (
						<MailAccountRow
							key={account.id}
							account={account}
							onRevoked={() =>
								queryClient.invalidateQueries({
									queryKey: ['user-mail-accounts'],
								})
							}
						/>
					))}
				</Stack>
			)}
		</Stack>
	);
}

type RowProps = {
	account: MailAccount;
	onRevoked: () => void;
};

function MailAccountRow({ account, onRevoked }: RowProps) {
	const [opened, { open, close }] = useDisclosure(false);

	const revokeMutation = useActionMutation(
		() => deleteMailAccount(account.id),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Email revoked',
					message: `${account.email} has been removed`,
					color: 'green',
				});
				close();
				onRevoked();
			},
			onError: (error: Error) => {
				notifications.show({
					title: 'Revocation failed',
					message: error.message,
					color: 'red',
				});
			},
		}
	);

	return (
		<>
			<Paper p='sm' radius='md' withBorder>
				<Group justify='space-between' wrap='nowrap'>
					<Group gap='xs' wrap='nowrap'>
						<IconMail size={16} opacity={0.6} />
						<Stack gap={2}>
							<Group gap='xs'>
								<Text size='sm' fw={500}>
									{account.email}
								</Text>
								{account.isPrimary && (
									<Badge size='xs' variant='filled'>
										Primary
									</Badge>
								)}
								{!account.isActive && (
									<Badge size='xs' color='red' variant='light'>
										Inactive
									</Badge>
								)}
							</Group>
							{account.displayName && (
								<Text size='xs' c='dimmed'>
									{account.displayName}
								</Text>
							)}
						</Stack>
					</Group>
					<ActionIcon variant='subtle' color='red' size='sm' onClick={open}>
						<IconTrash size={14} />
					</ActionIcon>
				</Group>
			</Paper>

			<Modal
				opened={opened}
				onClose={close}
				title='Revoke email'
				size='sm'
				centered
			>
				<Text size='sm' c='dimmed'>
					Are you sure you want to revoke access to{' '}
					<Text span fw={600}>
						{account.email}
					</Text>
					? This will remove all assignments for this email.
				</Text>
				<Group justify='flex-end' mt='lg' gap='sm'>
					<Button variant='default' onClick={close}>
						Cancel
					</Button>
					<Button
						color='red'
						leftSection={<IconTrash size={14} />}
						loading={revokeMutation.isPending}
						onClick={() => revokeMutation.mutate()}
					>
						Revoke
					</Button>
				</Group>
			</Modal>
		</>
	);
}
