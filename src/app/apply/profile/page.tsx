'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
  Box,
  Center,
  Loader,
  Stack,
  Text
} from '@mantine/core';
import ApplyHeader from '../_components/ApplyHeader';
import { ProfileView } from './_components/ProfileView';

export default function ProfilePage() {
	const { applicant, isLoading } = useApplicant();

	if (isLoading) {
		return (
			<Box mih='100vh'>
				<ApplyHeader />
				<Center h='100vh'>
					<Loader size='lg' />
				</Center>
			</Box>
		);
	}

	if (!applicant) {
		return (
			<Box mih='100vh'>
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
