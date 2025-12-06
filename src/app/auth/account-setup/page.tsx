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
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/shared/ui/Logo';

export default function AccountSetupPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	if (status === 'loading') {
		return (
			<Center h='100vh'>
				<Loader />
			</Center>
		);
	}

	if (session?.user?.role !== 'user') {
		router.push('/');
	}

	const handleLogout = () => {
		modals.openConfirmModal({
			centered: true,
			title: 'Confirm logout',
			children: 'Are you sure you want to logout?',
			confirmProps: { color: 'red' },
			labels: { confirm: 'Logout', cancel: 'Cancel' },
			onConfirm: () => signOut({ callbackUrl: '/auth/login' }),
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
									Account Not Found
								</Title>
								<Text c='dimmed' ta='center' size='md'>
									Your email is not associated with any account
								</Text>
							</Stack>
						</Stack>

						<Divider w='100%' />

						<Stack gap='lg' w='100%'>
							<Card p='md'>
								<Group gap='xs' align='center' justify='center'>
									<IconMail size={16} />
									<Text size='sm' fw={500}>
										{session?.user?.email}
									</Text>
								</Group>
							</Card>

							<Text ta='center' c='dimmed' size='sm' lh={1.5}>
								This email address is not registered in our system. Please
								contact the Registry Department for assistance.
							</Text>

							<Center>
								<Text
									size='sm'
									c='blue'
									component='a'
									href='mailto:registry@limkokwing.ac.ls'
									td='underline'
									fw={500}
								>
									registry@limkokwing.ac.ls
								</Text>
							</Center>
						</Stack>

						<Divider w='100%' />

						<Button
							variant='outline'
							color='gray'
							leftSection={<IconLogout size={16} />}
							onClick={handleLogout}
						>
							Sign Out
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
