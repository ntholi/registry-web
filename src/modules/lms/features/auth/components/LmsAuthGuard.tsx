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
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconSchool } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { checkMoodleAuth, linkMoodleAccount } from '../server/actions';

export default function LmsAuthGuard({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();

	const { data: authStatus, isLoading } = useQuery({
		queryKey: ['lms-auth-status'],
		queryFn: checkMoodleAuth,
		staleTime: 5 * 60 * 1000,
	});

	const linkMutation = useMutation({
		mutationFn: linkMoodleAccount,
		onSuccess: (result) => {
			if (result.success) {
				notifications.show({
					title: 'Success',
					message: 'Your Moodle account has been linked successfully',
					color: 'green',
				});
				queryClient.invalidateQueries({ queryKey: ['lms-auth-status'] });
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to link Moodle account',
					color: 'red',
				});
			}
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to link account',
				color: 'red',
			});
		},
	});

	if (isLoading) {
		return (
			<Center h='60vh'>
				<Stack align='center' gap='md'>
					<Loader size='lg' />
					<Text c='dimmed'>Checking LMS access...</Text>
				</Stack>
			</Center>
		);
	}

	if (authStatus?.needsLinking) {
		return (
			<Center h='60vh'>
				<Paper p='xl' withBorder maw={500} w='100%'>
					<Stack align='center' gap='lg'>
						<IconSchool
							size={64}
							stroke={1.5}
							color='var(--mantine-color-blue-6)'
						/>
						<Stack align='center' gap='xs'>
							<Title order={2} fw={500}>
								LMS Access Required
							</Title>
							<Text c='dimmed' ta='center'>
								To access the LMS, your account needs to be linked with Moodle.
							</Text>
						</Stack>

						<Alert
							icon={<IconAlertCircle size={16} />}
							title='Moodle Account Not Found'
							color='yellow'
							w='100%'
						>
							We couldn&apos;t find a Moodle account associated with your email.
							Please ensure you have a Moodle account with the same email
							address you use to sign in here.
						</Alert>

						<Button
							size='md'
							onClick={() => linkMutation.mutate()}
							loading={linkMutation.isPending}
							fullWidth
						>
							Link Moodle Account
						</Button>

						<Text size='xs' c='dimmed' ta='center'>
							If you don&apos;t have a Moodle account, please contact your
							administrator.
						</Text>
					</Stack>
				</Paper>
			</Center>
		);
	}

	if (!authStatus?.isAuthenticated) {
		return (
			<Center h='60vh'>
				<Paper p='xl' withBorder maw={500} w='100%'>
					<Stack align='center' gap='lg'>
						<IconSchool
							size={64}
							stroke={1.5}
							color='var(--mantine-color-blue-6)'
						/>
						<Stack align='center' gap='xs'>
							<Title order={2} fw={500}>
								LMS Access Required
							</Title>
							<Text c='dimmed' ta='center'>
								Please sign in to access the Learning Management System.
							</Text>
						</Stack>
					</Stack>
				</Paper>
			</Center>
		);
	}

	return <>{children}</>;
}
