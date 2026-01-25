import { Center, Loader, Stack, Text } from '@mantine/core';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/core/auth';
import { dashboardUsers } from '@/core/database';

function LoadingComponent() {
	return (
		<Center h='100vh'>
			<Stack align='center' gap='1rem'>
				<Loader size='2rem' c='blue' />
				<Text size='0.875rem' c='dimmed'>
					Verifying authentication...
				</Text>
			</Stack>
		</Center>
	);
}

async function AuthHandler() {
	const session = await auth();

	if (session?.user) {
		const role = session.user.role;

		if (role === 'student') {
			redirect('/student-portal');
		} else if (role === 'applicant') {
			redirect('/apply');
		} else if (role !== 'user' && dashboardUsers.enumValues.includes(role)) {
			redirect('/dashboard');
		} else {
			redirect('/auth/account-setup');
		}
	} else {
		redirect('/auth/login');
	}

	return null;
}

export default function HomePage() {
	return (
		<Suspense fallback={<LoadingComponent />}>
			<AuthHandler />
		</Suspense>
	);
}
