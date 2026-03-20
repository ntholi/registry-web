'use client';

import { deleteMailAccount } from '@mail/accounts/_server/actions';
import {
	ActionIcon,
	Badge,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMail, IconPlus, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';

type Account = {
	id: string;
	email: string;
	displayName: string | null;
	isPrimary: boolean;
	isActive: boolean;
	createdAt: Date;
};

type Props = {
	accounts: Account[];
};

export default function MailAccountCards({ accounts }: Props) {
	const _router = useRouter();

	return (
		<Stack gap='md'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
				{accounts.map((account) => (
					<AccountCard key={account.id} account={account} />
				))}
				<ConnectCard />
			</SimpleGrid>
			{accounts.length === 0 && (
				<Text c='dimmed' ta='center' py='xl' size='sm'>
					No email accounts connected yet. Connect one to get started.
				</Text>
			)}
		</Stack>
	);
}

function AccountCard({ account }: { account: Account }) {
	const router = useRouter();
	const revoke = useActionMutation(deleteMailAccount, {
		onSuccess: () => {
			notifications.show({
				title: 'Email Disconnected',
				message: `${account.email} has been removed`,
				color: 'green',
			});
			router.refresh();
		},
		onError: (err) => {
			notifications.show({
				title: 'Error',
				message: err.message,
				color: 'red',
			});
		},
	});

	return (
		<Card withBorder padding='lg' radius='md'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Group gap='sm'>
						<ThemeIcon
							size='lg'
							radius='xl'
							variant='light'
							color={account.isActive ? 'blue' : 'gray'}
						>
							<IconMail size='1rem' />
						</ThemeIcon>
						<div>
							<Text size='sm' fw={600} lineClamp={1}>
								{account.displayName || account.email.split('@')[0]}
							</Text>
							<Text size='xs' c='dimmed' lineClamp={1}>
								{account.email}
							</Text>
						</div>
					</Group>
					<ActionIcon
						variant='subtle'
						color='red'
						size='sm'
						loading={revoke.isPending}
						onClick={() => revoke.mutate(account.id)}
						aria-label='Disconnect email'
					>
						<IconTrash size='0.875rem' />
					</ActionIcon>
				</Group>
				<Group gap='xs'>
					{account.isPrimary && (
						<Badge size='xs' variant='light' color='teal'>
							Primary
						</Badge>
					)}
					<Badge
						size='xs'
						variant='light'
						color={account.isActive ? 'green' : 'gray'}
					>
						{account.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</Group>
			</Stack>
		</Card>
	);
}

function ConnectCard() {
	return (
		<Card
			withBorder
			padding='lg'
			radius='md'
			component='a'
			href='/api/auth/gmail?returnUrl=/profile'
			style={{ cursor: 'pointer', borderStyle: 'dashed' }}
		>
			<Stack align='center' justify='center' gap='xs' h='100%' py='md'>
				<ThemeIcon size='xl' radius='xl' variant='light' color='gray'>
					<IconPlus size='1.25rem' />
				</ThemeIcon>
				<Text size='sm' c='dimmed' fw={500}>
					Connect Email
				</Text>
			</Stack>
		</Card>
	);
}
