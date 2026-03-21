'use client';

import { Box, Divider, Kbd, TextInput, ThemeIcon } from '@mantine/core';
import { spotlight } from '@mantine/spotlight';
import { IconSearch } from '@tabler/icons-react';

type SearchInputProps = {
	value: string;
	onChange: (value: string) => void;
};

export default function SearchInput({ value, onChange }: SearchInputProps) {
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
				placeholder='Search...'
				leftSection={
					<ThemeIcon variant='transparent' color='gray' mr={'xs'}>
						<IconSearch size='1.2rem' />
					</ThemeIcon>
				}
				rightSection={
					<Kbd size='xs' px={5} py={2}>
						Ctrl+K
					</Kbd>
				}
				rightSectionWidth={60}
				leftSectionWidth={40}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onClick={() => spotlight.open()}
				variant='unstyled'
			/>
			<Divider mt={5} />
		</Box>
	);
}
