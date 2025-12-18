import { createTask, TaskForm } from '@admin/tasks';
import { Box } from '@mantine/core';

export default function NewTaskPage() {
	return (
		<Box p='lg'>
			<TaskForm title='Create Task' onSubmit={createTask} />
		</Box>
	);
}
