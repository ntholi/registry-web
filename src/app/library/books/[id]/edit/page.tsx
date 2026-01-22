import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getBook, updateBook } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Book'
				defaultValues={book}
				onSubmit={async (value, authorIds, categoryIds) => {
					'use server';
					return updateBook(Number(id), value, authorIds, categoryIds);
				}}
			/>
		</Box>
	);
}
