import { Form } from '@admin/tasks';
import { createTask } from '@admin/tasks/server';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Task'} onSubmit={createTask} />
		</Box>
	);
}
