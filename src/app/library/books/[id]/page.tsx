import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import BookTabs from '../_components/BookTabs';
import { deleteBook, getBook } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookDetailsPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(id);

	if (!book) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={book.title}
				queryKey={['books']}
				handleDelete={async () => {
					'use server';
					await deleteBook(id);
				}}
			/>
			<Box mt='xl'>
				<BookTabs book={book} />
			</Box>
		</DetailsView>
	);
}
