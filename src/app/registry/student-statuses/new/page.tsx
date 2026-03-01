import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createStudentStatus } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<Form title='New Application' onSubmit={createStudentStatus} />
		</Box>
	);
}
