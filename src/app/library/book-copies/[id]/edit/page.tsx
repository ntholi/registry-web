import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import Form from '../../_components/Form';
import { getBookCopy, updateBookCopy } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditBookCopyPage({ params }: Props) {
	const { id } = await params;
	const copy = await getBookCopy(id);

	if (!copy) return notFound();

	return (
		<Box p='lg'>
			<Form
				bookId={copy.bookId}
				title='Edit Book Copy'
				defaultValues={copy}
				returnPath={`/library/book-copies/${id}`}
				onSubmit={async (value) => {
					'use server';
					return unwrap(await updateBookCopy(id, value));
				}}
			/>
		</Box>
	);
}
