'use client';

import {
	Alert,
	Button,
	Center,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconLock, IconSchool, IconUserPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import type { PropsWithChildren } from 'react';

export default function LmsAuthGuard({ children }: PropsWithChildren) {
	const { data: session, status } = useSession();
	const lmsUserId = session?.user?.lmsUserId;
	const lmsToken = session?.user?.lmsToken;

	if (status === 'loading') {
		return (
			<Center h='60vh'>
				<Loader size='lg' />
			</Center>
		);
	}

	if (lmsUserId && !lmsToken) {
		return (
			<Center h='60vh'>
				<Paper p='xl' withBorder maw={500} w='100%'>
					<Stack align='center' gap='lg'>
						<IconLock
							size={64}
							stroke={1.5}
							color='var(--mantine-color-orange-6)'
						/>
						<Stack align='center' gap='xs'>
							<Title order={2} fw={'normal'}>
								Access Pending
							</Title>
							<Text size='sm' c='dimmed' ta='center'>
								Your account is linked to Moodle, but LMS access is not yet
								activated.
							</Text>
						</Stack>
						<Alert color='orange' w='100%' variant='light'>
							<Stack gap='xs'>
								<Text size='sm' fw={500}>
									Action Required
								</Text>
								<Text size='sm'>
									Please contact your administrator to activate your LMS access
									token.
								</Text>
								<Text size='xs' c='dimmed'>
									Your Moodle User ID: {lmsUserId}
								</Text>
							</Stack>
						</Alert>
					</Stack>
				</Paper>
			</Center>
		);
	}

	if (!lmsUserId) {
		return (
			<Center h='80vh'>
				<Paper p='xl' withBorder maw={500} w='100%'>
					<Stack align='center' gap='lg'>
						<IconSchool
							size={64}
							stroke={1.5}
							color='var(--mantine-color-blue-6)'
						/>
						<Stack align='center' gap='xs'>
							<Title order={2} fw={'normal'}>
								LMS Access Required
							</Title>
							<Alert w='100%' color='blue' variant='light'>
								<Stack gap='xs'>
									<Text size='sm' fw={500}>
										Contact Administrator
									</Text>
									<Text size='sm'>
										To access LMS features, please contact your administrator to
										set up your Moodle account and access token.
									</Text>
								</Stack>
							</Alert>
						</Stack>

						<Stack w='100%' gap='xs'>
							<Text size='sm' c='dimmed' ta='center'>
								Don&apos;t have a Moodle account?
							</Text>
							<Button
								component='a'
								href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/login/index.php`}
								target='_blank'
								rel='noopener noreferrer'
								variant='outline'
								leftSection={<IconUserPlus size={'1rem'} />}
								fullWidth
							>
								Create Moodle Account
							</Button>
							<Text size='xs' c='dimmed' ta='center'>
								After creating your account, contact your administrator
							</Text>
						</Stack>
					</Stack>
				</Paper>
			</Center>
		);
	}

	return <>{children}</>;
}
