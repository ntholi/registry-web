import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createSubject } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Subject' onSubmit={createSubject} />
		</Box>
	);
}
