import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createBook } from '../_server/actions';

export default function NewBookPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Book'
				onSubmit={async (book, authorIds, categoryIds) => {
					'use server';
					return createBook(book, authorIds, categoryIds);
				}}
			/>
		</Box>
	);
}
