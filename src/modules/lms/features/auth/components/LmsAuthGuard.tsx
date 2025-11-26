'use client';

import {
	Button,
	Center,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { getLmsUserId } from '../server/actions';

export default function LmsAuthGuard({ children }: PropsWithChildren) {
	const { data: lmsUserId, isLoading } = useQuery({
		queryKey: ['lms-user-id'],
		queryFn: getLmsUserId,
		staleTime: 5 * 60 * 1000,
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
								Account Not Linked
							</Title>
							<Text c='dimmed' ta='center'>
								Your account is not linked to Moodle. If you don&apos;t have a
								Moodle account yet, please create one first.
							</Text>
						</Stack>

						<Button
							component='a'
							href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/login/index.php`}
							target='_blank'
							rel='noopener noreferrer'
							size='md'
							fullWidth
						>
							Create Moodle Account
						</Button>

						<Text size='xs' c='dimmed' ta='center'>
							After creating your Moodle account, please contact the
							administrator to link it to your Registry account.
						</Text>
					</Stack>
				</Paper>
			</Center>
		);
	}

	return <>{children}</>;
}
