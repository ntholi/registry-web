import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { IconBook, IconCopy } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
} from '@/shared/ui/adease';
import BookCopiesTab from '../_components/BookCopiesTab';
import BookDetailsTab from '../_components/BookDetailsTab';
import { deleteBook, getBook } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookDetailsPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={book.title}
				queryKey={['books']}
				handleDelete={async () => {
					'use server';
					await deleteBook(Number(id));
				}}
			/>
			<DetailsViewBody gap={0}>
				<Tabs defaultValue='book'>
					<TabsList>
						<TabsTab value='book' leftSection={<IconBook size={16} />}>
							Book
						</TabsTab>
						<TabsTab value='copies' leftSection={<IconCopy size={16} />}>
							Copies
						</TabsTab>
					</TabsList>

					<TabsPanel value='book' pt='md'>
						<BookDetailsTab book={book} />
					</TabsPanel>

					<TabsPanel value='copies' pt='md'>
						<BookCopiesTab bookId={book.id} />
					</TabsPanel>
				</Tabs>
			</DetailsViewBody>
		</DetailsView>
	);
}
