'use client';

import { Center, Container, Loader } from '@mantine/core';
import ActionButtons from '@/modules/student-portal/features/home/components/ActionButtons';
import Hero from '@/modules/student-portal/features/home/components/Hero';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

export default function Page() {
	const {
		program: _program,
		semester: _semester,
		isLoading,
	} = useUserStudent();

	if (isLoading) {
		return (
			<Center h='100vh' w='100vw'>
				<Loader />
			</Center>
		);
	}

	return (
		<Container size='md'>
			<Hero />
			<ActionButtons />
		</Container>
	);
}
