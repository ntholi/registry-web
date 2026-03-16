import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import Form from '../_components/Form';
import { createBook } from '../_server/actions';

export default function NewBookPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Book'
				onSubmit={async (book, authorIds, categoryIds) => {
					'use server';
					return unwrap(await createBook(book, authorIds, categoryIds));
				}}
			/>
		</Box>
	);
}
