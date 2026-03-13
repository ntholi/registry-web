import {
	Box,
	Container,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { getStudentRegistrationHistory } from '@registry/registration/requests';
import { Suspense } from 'react';
import { requireCurrentStudent } from '../_server/student';
import {
	NewRegistrationCard,
	NewRegistrationCardSkeleton,
	RegistrationHistory,
	RegistrationHistorySkeleton,
} from './_components';

export default async function RegistrationPage() {
	const stdNo = await requireCurrentStudent();
	const registrationHistory = await getStudentRegistrationHistory(stdNo);

	return (
		<Container size='md'>
			<Stack gap='xl'>
				<Group justify='space-between' align='flex-start'>
					<Box>
						<Title order={1} size='h2' fw={600} mb='xs'>
							Registration Requests
						</Title>
						<Text c='dimmed' size='sm'>
							View and track all your registration requests and their current
							status
						</Text>
					</Box>
				</Group>

				<Suspense fallback={<NewRegistrationCardSkeleton />}>
					<NewRegistrationCard />
				</Suspense>

				<Divider />

				<Suspense fallback={<RegistrationHistorySkeleton />}>
					<RegistrationHistory data={registrationHistory} stdNo={stdNo} />
				</Suspense>
			</Stack>
		</Container>
	);
}
