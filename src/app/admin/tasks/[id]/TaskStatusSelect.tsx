'use client';

import { updateTaskStatus } from '@admin/tasks';
import { Button, Group, Select } from '@mantine/core';
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
	const [status, setStatus] = useState<TaskStatus>(currentStatus);
	const queryClient = useQueryClient();
	const router = useRouter();
	const isStatusChanged = status !== currentStatus;

	async function handleStatusUpdate() {
		if (!isStatusChanged) return;

		setIsUpdating(true);
		try {
			await updateTaskStatus(taskId, status);
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
		<Group gap='xs'>
			<Select
				size='sm'
				placeholder='Change status'
				data={statusOptions}
				value={status}
				onChange={(value) => {
					if (!value) return;
					setStatus(value as TaskStatus);
				}}
				disabled={isUpdating}
				w={150}
			/>
			<Button
				size='sm'
				onClick={handleStatusUpdate}
				loading={isUpdating}
				variant={isStatusChanged ? 'filled' : 'default'}
			>
				Update
			</Button>
		</Group>
	);
}
