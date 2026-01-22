'use client';

import {
	Center,
	Loader,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconBook, IconSearch, IconWriting } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { getCatalogBooks, getCatalogPublications } from '../_server/actions';
import type { CatalogBook, CatalogPublication } from '../_server/types';
import BookCard from './BookCard';
import BookDetailModal from './BookDetailModal';
import PublicationCard from './PublicationCard';

type Props = {
	initialBooks: CatalogBook[];
	initialPublications: CatalogPublication[];
};

export default function CatalogTabs({
	initialBooks,
	initialPublications,
}: Props) {
	const [tab, setTab] = useQueryState(
		'tab',
		parseAsString.withDefault('books')
	);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);

	const { data: books, isLoading: booksLoading } = useQuery({
		queryKey: ['catalog-books', debouncedSearch],
		queryFn: () => getCatalogBooks(debouncedSearch),
		initialData: initialBooks,
		enabled: tab === 'books',
	});

	const { data: publications, isLoading: pubsLoading } = useQuery({
		queryKey: ['catalog-publications', debouncedSearch],
		queryFn: () => getCatalogPublications(debouncedSearch),
		initialData: initialPublications,
		enabled: tab === 'publications',
	});

	return (
		<Stack gap='md'>
			<TextInput
				placeholder='Search...'
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<Tabs value={tab} onChange={(v) => setTab(v || 'books')}>
				<Tabs.List mb='md'>
					<Tabs.Tab value='books' leftSection={<IconBook size={16} />}>
						Books
					</Tabs.Tab>
					<Tabs.Tab
						value='publications'
						leftSection={<IconWriting size={16} />}
					>
						Publications
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='books'>
					{booksLoading ? (
						<Center py='xl'>
							<Loader />
						</Center>
					) : books.length === 0 ? (
						<Center py='xl'>
							<Stack align='center' gap='sm'>
								<IconBook size={48} color='var(--mantine-color-dimmed)' />
								<Text c='dimmed'>No books found</Text>
							</Stack>
						</Center>
					) : (
						<SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }}>
							{books.map((book) => (
								<BookDetailModal key={book.id} book={book}>
									<BookCard book={book} />
								</BookDetailModal>
							))}
						</SimpleGrid>
					)}
				</Tabs.Panel>

				<Tabs.Panel value='publications'>
					{pubsLoading ? (
						<Center py='xl'>
							<Loader />
						</Center>
					) : publications.length === 0 ? (
						<Center py='xl'>
							<Stack align='center' gap='sm'>
								<IconWriting size={48} color='var(--mantine-color-dimmed)' />
								<Text c='dimmed'>No publications found</Text>
							</Stack>
						</Center>
					) : (
						<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
							{publications.map((pub) => (
								<PublicationCard key={pub.id} publication={pub} />
							))}
						</SimpleGrid>
					)}
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
