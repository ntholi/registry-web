'use client';

import { Box, Divider, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface UniversalSearchProps {
	value: string;
	onChange: (value: string) => void;
}

export default function UniversalSearch({
	value,
	onChange,
}: UniversalSearchProps) {
	return (
		<Box
			pos='sticky'
			top={0}
			pt='sm'
			pb='xs'
			mt='calc(var(--mantine-spacing-sm) * -1)'
			style={{ zIndex: 1000 }}
			bg='var(--mantine-color-body)'
		>
			<TextInput
				placeholder='Menu...'
				leftSection={<IconSearch size='0.9rem' />}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				variant='unstyled'
			/>
			<Divider mt={5} />
		</Box>
	);
}
