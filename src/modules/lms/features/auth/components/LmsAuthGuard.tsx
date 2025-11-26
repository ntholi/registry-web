'use client';

import {
	Alert,
	Button,
	Center,
	Divider,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLink, IconSchool, IconUserPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { getLmsUserId, linkMoodleAccount } from '../server/actions';

export default function LmsAuthGuard({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();

	const { data: lmsUserId, isLoading } = useQuery({
		queryKey: ['lms-user-id'],
		queryFn: getLmsUserId,
		staleTime: 5 * 60 * 1000,
	});

	const linkMutation = useMutation({
		mutationFn: linkMoodleAccount,
		onSuccess: (result) => {
			if (result.success) {
				notifications.show({
					title: 'Account Linked',
					message: 'Your Moodle account has been linked successfully!',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['lms-user-id'] });
			} else {
				notifications.show({
					title: 'Link Failed',
					message: result.error || 'Failed to link Moodle account',
					color: 'red',
				});
			}
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'An unexpected error occurred while linking your account',
				color: 'red',
			});
		},
	});

	if (isLoading) {
		return (
			<Center h='60vh'>
				<Loader size='lg' />
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
								Account Not Linked
							</Title>
							<Alert w='100%' color='yellow' variant='light'>
								Your account is not linked to a Moodle account. To access LMS
								features, please link your Moodle account below.
							</Alert>
						</Stack>

						<Stack w='100%' gap='md'>
							<Stack gap='xs'>
								<Text size='sm'>Already have a Moodle account?</Text>
								<Button
									leftSection={<IconLink size={'1rem'} />}
									onClick={() => linkMutation.mutate()}
									loading={linkMutation.isPending}
									fullWidth
									variant='light'
								>
									Link My Moodle Account
								</Button>
							</Stack>

							<Divider label='or' labelPosition='center' />

							<Stack gap='xs'>
								<Text size='sm'>Don&apos;t have a Moodle account?</Text>
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
									After creating your account, come back and click &quot;Link My
									Moodle Account&quot;
								</Text>
							</Stack>
						</Stack>
					</Stack>
				</Paper>
			</Center>
		);
	}

	return <>{children}</>;
}
