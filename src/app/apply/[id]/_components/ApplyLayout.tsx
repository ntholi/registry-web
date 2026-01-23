'use client';

import { Box, Container, useMantineColorScheme } from '@mantine/core';
import ApplyHeader from '@/app/apply/_components/ApplyHeader';

type Props = {
	applicantId: string;
	children: React.ReactNode;
};

export default function ApplyLayout({ applicantId, children }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<ApplyHeader applicantId={applicantId} />
			<Container size='lg' py='xl' pt={100}>
				{children}
			</Container>
		</Box>
	);
}
