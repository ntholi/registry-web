'use client';

import '@mantine/core/styles.css';

import {
	Button,
	Center,
	Container,
	Group,
	MantineProvider,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang='en'>
			<body>
				<MantineProvider defaultColorScheme='dark'>
					<Center h='100dvh'>
						<Container size='xs'>
							<Stack align='center' gap='md'>
								<ThemeIcon size={64} radius='xl' variant='light' color='red'>
									<IconAlertTriangle size={32} />
								</ThemeIcon>
								<Title order={1} ta='center' size='h2'>
									Something went wrong
								</Title>
								<Text c='dimmed' ta='center'>
									An unexpected error occurred. Please try again.
								</Text>
								<Group mt='sm'>
									<Button
										variant='light'
										color='red'
										leftSection={<IconArrowLeft size='1.2rem' />}
										onClick={() => window.location.reload()}
									>
										Reload page
									</Button>
									<Button color='red' onClick={reset}>
										Try again
									</Button>
								</Group>
							</Stack>
						</Container>
					</Center>
				</MantineProvider>
			</body>
		</html>
	);
}
