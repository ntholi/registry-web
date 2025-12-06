import { createTask, Form } from '@admin/tasks';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Task'} onSubmit={createTask} />
		</Box>
	);
}
