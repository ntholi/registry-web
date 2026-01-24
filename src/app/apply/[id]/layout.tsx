'use client';

import { Box, Container, useMantineColorScheme } from '@mantine/core';
import ApplyHeader from '../_components/ApplyHeader';

type Props = {
	children: React.ReactNode;
};

export default function ApplyLayout({ children }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<ApplyHeader />
			<Container size='lg' py='xl' pt={100}>
				{children}
			</Container>
		</Box>
	);
}
