'use client';

import {
	Button,
	Card,
	Center,
	Container,
	Divider,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconLogout, IconMail } from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/shared/ui/Logo';

function formatRole(role: string): string {
	return role
		.replace(/_/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export default function ApplyRestrictedPage() {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return (
			<Center h='100vh'>
				<Loader />
			</Center>
		);
	}

	const role = session?.user?.role ?? 'user';

	const handleLogout = () => {
		modals.openConfirmModal({
			centered: true,
			title: 'Confirm logout',
			children:
				'Are you sure you want to logout? You can then sign in with a different email to apply.',
			confirmProps: { color: 'red' },
			labels: { confirm: 'Logout', cancel: 'Cancel' },
			onConfirm: () => signOut({ callbackUrl: '/apply' }),
		});
	};

	return (
		<Container size='sm' h='100vh'>
			<Center h='100%'>
				<Paper p='xl' w='100%' maw={480} withBorder>
					<Stack gap='xl' align='center'>
						<Logo height={100} />

						<Stack gap='md' align='center'>
							<Stack gap='xs' align='center'>
								<Title order={2} size='h3' fw={600} ta='center'>
									Application Not Available
								</Title>
								<Text c='dimmed' ta='center' size='md'>
									Your account role does not permit applications
								</Text>
							</Stack>
						</Stack>

						<Divider w='100%' />

						<Stack gap='lg' w='100%'>
							<Card p='md' bg='var(--mantine-color-dark-6)'>
								<Group gap='xs' align='center' justify='center'>
									<IconMail size={16} />
									<Text size='sm' fw={500}>
										{session?.user?.email}
									</Text>
								</Group>
							</Card>

							<Text ta='center' c='dimmed' size='sm' lh={1.6}>
								This email address is associated with a{' '}
								<Text span fw={600} c={'gray'}>
									{formatRole(role)}
								</Text>{' '}
								account. Staff and existing students cannot submit new
								applications using emails associated with the University.
							</Text>
						</Stack>

						<Divider w='100%' />

						<Button
							variant='outline'
							color='gray'
							leftSection={<IconLogout size={16} />}
							onClick={handleLogout}
						>
							Sign Out & Apply with Different Email
						</Button>

						<Text size='xs' c='dimmed' ta='center' mt='md'>
							Limkokwing University Registry System
						</Text>
					</Stack>
				</Paper>
			</Center>
		</Container>
	);
}
