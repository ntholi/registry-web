'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Paper, Skeleton, Stack, Title } from '@mantine/core';
import PersonalInfoForm from './_components/PersonalInfoForm';

export default function PersonalInfoPage() {
	const { applicant, isLoading } = useApplicant();

	if (isLoading || !applicant) {
		return (
			<Stack gap='lg'>
				<Title order={2}>Personal Information</Title>
				<Paper withBorder p='lg' radius='md'>
					<Stack gap='md'>
						<Skeleton h={40} />
						<Skeleton h={40} />
						<Skeleton h={40} />
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			<Title order={2}>Personal Information</Title>
			<Paper withBorder p='lg' radius='md'>
				<PersonalInfoForm />
			</Paper>
		</Stack>
	);
}
