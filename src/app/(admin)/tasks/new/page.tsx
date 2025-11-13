import { Box } from '@mantine/core';
import Form from '@/modules/admin/features/tasks/components/Form';
import { createTask } from '@/modules/admin/features/tasks/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Task'} onSubmit={createTask} />
		</Box>
	);
}
