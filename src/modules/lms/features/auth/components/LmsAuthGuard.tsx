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
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { PropsWithChildren } from 'react';
import { checkMoodleUserExists } from '../server/actions';

export default function LmsAuthGuard({ children }: PropsWithChildren) {
	const { data: session, status } = useSession();
	const lmsUserId = session?.user?.lmsUserId;
	const lmsToken = session?.user?.lmsToken;

	const { data: moodleCheck, isLoading: isCheckingMoodle } = useQuery({
		queryKey: ['moodle-user-check'],
		queryFn: checkMoodleUserExists,
		enabled: !lmsUserId || !lmsToken,
	});

	if (status === 'loading' || isCheckingMoodle) {
		return (
			<Center h='60vh'>
				<Loader size='lg' />
			</Center>
		);
	}

	if (!lmsUserId || !lmsToken) {
		if (moodleCheck?.exists) {
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
									Your Moodle account has been found, but LMS access is not yet
									activated in the system.
								</Text>
							</Stack>
							<Alert color='orange' w='100%' variant='light'>
								<Stack gap='xs'>
									<Text size='sm' fw={500}>
										Action Required
									</Text>
									<Text size='sm'>
										Please contact your administrator to activate your LMS
										access and link your account.
									</Text>
									{moodleCheck.user && (
										<Stack gap={4}>
											<Text size='xs' c='dimmed'>
												Moodle Account: {moodleCheck.user.email}
											</Text>
											<Text size='xs' c='dimmed'>
												Moodle User ID: {moodleCheck.user.id}
											</Text>
										</Stack>
									)}
								</Stack>
							</Alert>
						</Stack>
					</Paper>
				</Center>
			);
		}

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
								No Moodle Account Found
							</Title>
							<Text size='sm' c='dimmed' ta='center'>
								You need a Moodle account to access LMS features.
							</Text>
						</Stack>

						<Stack w='100%' gap='xs'>
							<Button
								component='a'
								href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/login/signup.php`}
								target='_blank'
								rel='noopener noreferrer'
								variant='filled'
								leftSection={<IconUserPlus size={'1rem'} />}
								fullWidth
							>
								Create Moodle Account
							</Button>
							<Text size='xs' c='dimmed' ta='center'>
								After creating your account, contact your administrator to link
								it to the system
							</Text>
						</Stack>
					</Stack>
				</Paper>
			</Center>
		);
	}

	return <>{children}</>;
}
