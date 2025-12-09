'use client';

import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconFileSearch } from '@tabler/icons-react';

export default function TurnitinView() {
	return (
		<Center py='xl'>
			<Stack align='center' gap='md'>
				<ThemeIcon size={60} variant='light' color='gray'>
					<IconFileSearch size={30} />
				</ThemeIcon>
				<Text c='dimmed' size='sm' ta='center'>
					Integration with Turnitin is not complete yet
				</Text>
			</Stack>
		</Center>
	);
}
