'use client';

import {
	Button,
	Group,
	Image,
	Modal,
	Paper,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { type BookLookupResult, lookupBook } from '../../_lib/google-books';

type Props = {
	isbn?: string;
	title?: string;
	onSelect: (book: BookLookupResult) => void;
};

export default function BookLookupModal({ isbn, title, onSelect }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<BookLookupResult[]>([]);

	async function handleLookup() {
		setLoading(true);
		const books = await lookupBook(isbn, title);
		setResults(books);
		setLoading(false);

		if (books.length === 1) {
			onSelect(books[0]);
		} else if (books.length > 1) {
			open();
		}
	}

	function handleSelect(book: BookLookupResult) {
		onSelect(book);
		close();
	}

	const canLookup = (isbn && isbn.length >= 10) || (title && title.length >= 2);

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconSearch size={14} />}
				onClick={handleLookup}
				loading={loading}
				disabled={!canLookup || loading}
			>
				Lookup
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Select Book'
				size='lg'
				centered
			>
				<ScrollArea.Autosize mah={400}>
					<Stack gap='xs'>
						{results.map((book) => (
							<UnstyledButton key={book.id} onClick={() => handleSelect(book)}>
								<Paper withBorder p='sm' radius='md'>
									<Group wrap='nowrap'>
										{book.thumbnail ? (
											<Image
												src={book.thumbnail}
												alt={book.title}
												w={50}
												h={70}
												fit='cover'
												radius='sm'
											/>
										) : (
											<Paper w={50} h={70} bg='dark.6' radius='sm' />
										)}
										<Stack gap={2} flex={1}>
											<Text fw={500} lineClamp={1}>
												{book.title}
											</Text>
											{book.authors.length > 0 && (
												<Text size='sm' c='dimmed' lineClamp={1}>
													{book.authors.join(', ')}
												</Text>
											)}
											<Group gap='xs'>
												{book.publisher && (
													<Text size='xs' c='dimmed'>
														{book.publisher}
													</Text>
												)}
												{book.publishedDate && (
													<Text size='xs' c='dimmed'>
														• {book.publishedDate}
													</Text>
												)}
											</Group>
										</Stack>
									</Group>
								</Paper>
							</UnstyledButton>
						))}
						{results.length === 0 && (
							<Text c='dimmed' ta='center' py='md'>
								No books found
							</Text>
						)}
					</Stack>
				</ScrollArea.Autosize>
			</Modal>
		</>
	);
}
