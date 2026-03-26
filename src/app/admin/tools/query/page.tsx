import {
	Box,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import type { Metadata } from 'next';
import QueryInterface from './_components/QueryInterface';

export const metadata: Metadata = {
	title: 'AI Query Builder | Registry',
};

export default function QueryPage() {
	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center'>
							<ThemeIcon size='xl' radius='sm' variant='light' color='blue'>
								<IconSparkles size={24} />
							</ThemeIcon>
							<Box>
								<Title fw={400} size='h4'>
									AI Query Builder
								</Title>
								<Text size='sm' c='dimmed'>
									Describe the data you need in plain English and AI will build
									and execute the query for you
								</Text>
							</Box>
						</Group>
					</Stack>
				</Paper>
				<QueryInterface />
			</Stack>
		</Container>
	);
}
