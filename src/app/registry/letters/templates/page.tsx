'use client';

import {
	Button,
	Group,
	SimpleGrid,
	Stack,
	TextInput,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import TemplateCard from '../_components/TemplateCard';
import { getLetterTemplates } from '../_server/actions';

export default function TemplatesPage() {
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);

	const { data } = useQuery({
		queryKey: ['letter-templates', debounced],
		queryFn: () => getLetterTemplates(1, debounced),
	});

	return (
		<Stack p='lg'>
			<Group justify='space-between'>
				<Title order={2}>Letter Templates</Title>
				<Button
					component={Link}
					href='/registry/letters/templates/new'
					leftSection={<IconPlus size={16} />}
				>
					New Template
				</Button>
			</Group>

			<TextInput
				placeholder='Search templates...'
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => setSearch(e.currentTarget.value)}
			/>

			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				{data?.items?.map((template) => (
					<TemplateCard key={template.id} template={template} />
				))}
			</SimpleGrid>
		</Stack>
	);
}
