import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import Form from '../_components/Form';
import { createAuthor } from '../_server/actions';

export default function NewAuthorPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Author'
				onSubmit={async (value) => {
					'use server';
					return unwrap(await createAuthor(value));
				}}
			/>
		</Box>
	);
}
