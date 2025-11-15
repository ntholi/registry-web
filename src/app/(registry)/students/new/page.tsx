import { Box } from '@mantine/core';
import { Form } from '@registry/students';
import { createStudent } from '@registry/students/server';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Student'} onSubmit={createStudent} />
		</Box>
	);
}
