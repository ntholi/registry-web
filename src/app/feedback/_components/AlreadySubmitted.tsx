import { Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconChecks } from '@tabler/icons-react';

export default function AlreadySubmitted() {
	return (
		<Container size='xs' py='xl'>
			<Stack align='center' gap='lg' ta='center'>
				<ThemeIcon size={80} radius='xl' color='blue' variant='light'>
					<IconChecks size={48} />
				</ThemeIcon>

				<Title order={2}>Feedback already submitted</Title>

				<Text c='dimmed'>
					This passphrase has already been used to submit feedback.
				</Text>

				<Text size='sm' c='dimmed'>
					Each passphrase can only be used once to ensure fairness.
				</Text>
			</Stack>
		</Container>
	);
}
