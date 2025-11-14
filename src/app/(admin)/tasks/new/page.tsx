import { Form } from '@admin/tasks';
import { Box } from '@mantine/core';
import { createTask } from '@/modules/admin/features/tasks/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Task'} onSubmit={createTask} />
		</Box>
	);
}
