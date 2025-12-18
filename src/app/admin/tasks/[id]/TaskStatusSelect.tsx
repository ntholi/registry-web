'use client';

import { updateTaskStatus } from '@admin/tasks';
import { Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';

type TaskStatus =
	| 'todo'
	| 'in_progress'
	| 'on_hold'
	| 'completed'
	| 'cancelled';

type Props = {
	taskId: number;
	currentStatus: TaskStatus;
};

const statusOptions = [
	{ value: 'todo', label: 'To Do' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

export default function TaskStatusSelect({ taskId, currentStatus }: Props) {
	const [isUpdating, setIsUpdating] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();

	async function handleStatusChange(newStatus: string | null) {
		if (!newStatus || newStatus === currentStatus) return;

		setIsUpdating(true);
		try {
			await updateTaskStatus(taskId, newStatus as TaskStatus);
			await queryClient.invalidateQueries({ queryKey: ['tasks'] });
			notifications.show({
				title: 'Status Updated',
				message: 'Task status has been updated successfully',
				color: 'green',
			});
			router.refresh();
		} catch (error) {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to update status',
				color: 'red',
			});
		} finally {
			setIsUpdating(false);
		}
	}

	return (
		<Select
			size='sm'
			placeholder='Change status'
			data={statusOptions}
			value={currentStatus}
			onChange={handleStatusChange}
			disabled={isUpdating}
			w={150}
		/>
	);
}
