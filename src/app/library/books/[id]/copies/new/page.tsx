import BookCopyForm from '@library/book-copies/_components/Form';
import { createBookCopy } from '@library/book-copies/_server/actions';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getBook } from '../../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NewBookCopyPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<Box p='lg'>
			<BookCopyForm
				bookId={Number(id)}
				title={`Add Copy - ${book.title}`}
				onSubmit={createBookCopy}
				returnPath={`/library/books/${id}/copies`}
			/>
		</Box>
	);
}
