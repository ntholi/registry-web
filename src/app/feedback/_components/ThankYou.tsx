'use client';

import { Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useEffect } from 'react';

type Props = {
	cycleName: string;
	ratedCount: number;
};

export default function ThankYou({ cycleName, ratedCount }: Props) {
	useEffect(() => {
		localStorage.removeItem('feedback-passphrase');
	}, []);

	return (
		<Container size='xs' py='xl'>
			<Stack align='center' gap='lg' ta='center'>
				<ThemeIcon size={80} radius='xl' color='green' variant='light'>
					<IconCircleCheck size={48} />
				</ThemeIcon>

				<Title order={2}>Thank you for your feedback!</Title>

				<Text c='dimmed'>{cycleName}</Text>

				<Text size='sm'>
					{ratedCount} lecturer{ratedCount !== 1 ? 's' : ''} rated
				</Text>

				<Text size='sm' c='dimmed'>
					Your feedback is anonymous and helps improve teaching quality.
				</Text>
			</Stack>
		</Container>
	);
}
