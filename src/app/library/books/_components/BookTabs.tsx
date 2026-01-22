'use client';

import { Box, Tabs } from '@mantine/core';
import { IconBook, IconCopy } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import type { BookWithRelations } from '../_lib/types';
import BookCopiesTab from './BookCopiesTab';
import BookCopyModal from './BookCopyModal';
import BookDetailsTab from './BookDetailsTab';

type Props = {
	book: BookWithRelations;
};

export default function BookTabs({ book }: Props) {
	const [tab, setTab] = useQueryState('tab', {
		defaultValue: 'book',
		parse: (value): 'book' | 'copies' =>
			value === 'copies' ? 'copies' : 'book',
	});

	return (
		<Tabs value={tab} onChange={(val) => setTab(val as 'book' | 'copies')}>
			<Tabs.List>
				<Tabs.Tab value='book' leftSection={<IconBook size={16} />}>
					Book
				</Tabs.Tab>
				<Tabs.Tab value='copies' leftSection={<IconCopy size={16} />}>
					Copies
				</Tabs.Tab>
				{tab === 'copies' && (
					<Box ml='auto'>
						<BookCopyModal bookId={book.id} />
					</Box>
				)}
			</Tabs.List>

			<Tabs.Panel value='book' pt='md'>
				<BookDetailsTab book={book} />
			</Tabs.Panel>

			<Tabs.Panel value='copies' pt='md'>
				<BookCopiesTab bookId={book.id} />
			</Tabs.Panel>
		</Tabs>
	);
}
