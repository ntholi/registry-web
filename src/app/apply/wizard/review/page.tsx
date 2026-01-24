'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Skeleton, Stack } from '@mantine/core';
import ReviewForm from './_components/ReviewForm';

export default function ReviewPage() {
	const { applicant, currentApplication, isLoading } = useApplicant();

	if (isLoading || !applicant) {
		return (
			<Stack gap='lg'>
				<Skeleton h={200} />
				<Skeleton h={200} />
				<Skeleton h={100} />
			</Stack>
		);
	}

	return <ReviewForm application={currentApplication} />;
}
