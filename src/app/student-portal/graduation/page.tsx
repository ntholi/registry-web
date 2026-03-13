import {
	Box,
	Container,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { Suspense } from 'react';
import { requireCurrentStudent } from '../_server/student';
import {
	GraduationHistory,
	GraduationHistorySkeleton,
	NewGraduationCard,
	NewGraduationCardSkeleton,
} from './_components';

export default async function GraduationPage() {
	const stdNo = await requireCurrentStudent();

	return (
		<Container size='md'>
			<Stack gap='xl'>
				<Group justify='space-between' align='flex-start'>
					<Box>
						<Title order={1} size='h2' fw={600} mb='xs'>
							Graduation Requests
						</Title>
						<Text c='dimmed' size='sm'>
							View and track your graduation request and its current status
						</Text>
					</Box>
				</Group>

				<Suspense fallback={<NewGraduationCardSkeleton />}>
					<NewGraduationCard />
				</Suspense>

				<Divider />

				<Suspense fallback={<GraduationHistorySkeleton />}>
					<GraduationHistory stdNo={stdNo} />
				</Suspense>
			</Stack>
		</Container>
	);
}
