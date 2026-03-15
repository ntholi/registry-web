import { getTask, TaskForm, updateTask } from '@admin/tasks';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: Props) {
	const { id } = await params;
	const task = unwrap(await getTask(id));

	if (!task) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<TaskForm
				title='Edit Task'
				defaultValues={task}
				onSubmit={async (values) => {
					'use server';
					return unwrap(await updateTask(id, values));
				}}
			/>
		</Box>
	);
}
