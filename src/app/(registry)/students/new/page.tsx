import { Box } from '@mantine/core';
import { createStudent, Form } from '@registry/students';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Student'} onSubmit={createStudent} />
		</Box>
	);
}
