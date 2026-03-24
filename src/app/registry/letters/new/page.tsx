import { Box, Title } from '@mantine/core';
import GenerateLetterForm from '../_components/GenerateLetterForm';

export default function NewLetterPage() {
	return (
		<Box p='lg'>
			<Title order={3} mb='lg'>
				Generate Letter
			</Title>
			<GenerateLetterForm />
		</Box>
	);
}
