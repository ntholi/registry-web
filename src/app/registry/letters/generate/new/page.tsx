import { Box, Title } from '@mantine/core';
import GenerateLetterForm from '../_components/GenerateLetterForm';

export default function NewLetterPage() {
	return (
		<Box p='xl'>
			<Title order={3} mb='lg'>
				Generate Letter
			</Title>
			<GenerateLetterForm />
		</Box>
	);
}
