'use client';

import { Center, Container, Loader } from '@mantine/core';
import useUserStudent from '@/hooks/use-user-student';
import ActionButtons from './home/ActionButtons';
import Hero from './home/Hero';

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
