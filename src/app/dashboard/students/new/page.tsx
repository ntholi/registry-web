import { Box } from '@mantine/core';
import { createStudent } from '@/server/students/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Student'} onSubmit={createStudent} />
		</Box>
	);
}
