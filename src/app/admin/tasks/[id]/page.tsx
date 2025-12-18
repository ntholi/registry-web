import { deleteTask, getTask } from '@admin/tasks';
import { Avatar, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import TaskStatusSelect from './TaskStatusSelect';

type Props = {
	params: Promise<{ id: string }>;
};

const priorityColors: Record<string, string> = {
	low: 'gray',
	medium: 'blue',
	high: 'orange',
	urgent: 'red',
};

const statusColors: Record<string, string> = {
	todo: 'gray',
	in_progress: 'blue',
	on_hold: 'yellow',
	completed: 'green',
	cancelled: 'red',
};

const statusLabels: Record<string, string> = {
	todo: 'To Do',
	in_progress: 'In Progress',
	on_hold: 'On Hold',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

function formatDate(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

function formatDateTime(date: Date | string | null | undefined) {
	if (!date) return null;
	return new Date(date).toLocaleString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default async function TaskDetails({ params }: Props) {
	const { id } = await params;
	const task = await getTask(Number(id));

	if (!task) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Task'
				queryKey={['tasks']}
				handleDelete={async () => {
					'use server';
					await deleteTask(Number(id));
				}}
			/>
			<DetailsViewBody>
				<Stack gap='md'>
					<FieldView label='Title'>
						<Text size='lg' fw={600}>
							{task.title}
						</Text>
					</FieldView>

					{task.description && (
						<FieldView label='Description'>
							<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
								{task.description}
							</Text>
						</FieldView>
					)}

					<FieldView label='Priority'>
						<Badge color={priorityColors[task.priority]} variant='light'>
							{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
						</Badge>
					</FieldView>

					<FieldView label='Status'>
						<Group gap='md'>
							<Badge color={statusColors[task.status]} variant='light'>
								{statusLabels[task.status]}
							</Badge>
							<TaskStatusSelect taskId={task.id} currentStatus={task.status} />
						</Group>
					</FieldView>

					{task.dueDate && (
						<FieldView label='Due Date'>
							<Text size='sm'>{formatDate(task.dueDate)}</Text>
						</FieldView>
					)}

					{task.scheduledDate && (
						<FieldView label='Scheduled Date'>
							<Text size='sm'>{formatDate(task.scheduledDate)}</Text>
						</FieldView>
					)}

					<FieldView label='Created By'>
						<Group gap='sm'>
							<Avatar
								src={task.creator.image}
								alt={task.creator.name || 'User'}
								size='sm'
								radius='xl'
							/>
							<Text size='sm'>{task.creator.name || task.creator.email}</Text>
						</Group>
					</FieldView>

					{task.assignees.length > 0 && (
						<FieldView label='Assigned To'>
							<Group gap='xs'>
								{task.assignees.map(({ user }) => (
									<Tooltip
										key={user.id}
										label={user.name || user.email}
										withArrow
									>
										<Avatar
											src={user.image}
											alt={user.name || 'User'}
											size='sm'
											radius='xl'
										/>
									</Tooltip>
								))}
							</Group>
						</FieldView>
					)}

					{task.completedAt && (
						<FieldView label='Completed At'>
							<Text size='sm'>{formatDateTime(task.completedAt)}</Text>
						</FieldView>
					)}

					<FieldView label='Created At'>
						<Text size='sm' c='dimmed'>
							{formatDateTime(task.createdAt)}
						</Text>
					</FieldView>

					<FieldView label='Last Updated' underline={false}>
						<Text size='sm' c='dimmed'>
							{formatDateTime(task.updatedAt)}
						</Text>
					</FieldView>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
