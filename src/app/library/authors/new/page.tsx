import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createAuthor } from '../_server/actions';

export default function NewAuthorPage() {
	return (
		<Box p='lg'>
			<Form title='Create Author' onSubmit={createAuthor} />
		</Box>
	);
}
