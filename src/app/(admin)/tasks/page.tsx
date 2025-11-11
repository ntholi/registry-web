import { Box, Text, Title } from '@mantine/core';

export default function Page() {
	return (
		<Box p='lg'>
			<Title order={2} mb='md'>
				Tasks
			</Title>
			<Text c='dimmed'>View and manage your tasks from the sidebar</Text>
		</Box>
	);
}
