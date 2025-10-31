import { Box } from '@mantine/core';
import { createTask } from '@/server/tasks/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Task'} onSubmit={createTask} />
		</Box>
	);
}
