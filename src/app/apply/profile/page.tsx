'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
	Box,
	Center,
	Loader,
	Stack,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import ApplyHeader from '../_components/ApplyHeader';
import { ProfileView } from './_components/ProfileView';

export default function ProfilePage() {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const { applicant, isLoading } = useApplicant();

	if (isLoading) {
		return (
			<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
				<ApplyHeader />
				<Center h='100vh'>
					<Loader size='lg' />
				</Center>
			</Box>
		);
	}

	if (!applicant) {
		return (
			<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
				<ApplyHeader />
				<Center h='100vh'>
					<Stack align='center'>
						<Text c='dimmed'>No profile found</Text>
					</Stack>
				</Center>
			</Box>
		);
	}

	return <ProfileView applicant={applicant} />;
}
