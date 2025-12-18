import { deleteTask, getTask } from '@admin/tasks';
import {
	Avatar,
	AvatarGroup,
	Badge,
	Box,
	Divider,
	Group,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconCalendar, IconUser } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
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
				<Stack gap='xl'>
					<Box>
						<Text size='xl' fw={600} mb='xs'>
							{task.title}
						</Text>
						<Group gap='xs'>
							<Badge
								color={statusColors[task.status]}
								variant='light'
								size='md'
							>
								{statusLabels[task.status]}
							</Badge>
							<Badge
								color={priorityColors[task.priority]}
								variant='dot'
								size='md'
							>
								{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
							</Badge>
							<TaskStatusSelect taskId={task.id} currentStatus={task.status} />
						</Group>
					</Box>

					{task.description && (
						<Box>
							<Text size='sm' fw={500} mb='xs' c='dimmed'>
								Description
							</Text>
							<Text
								size='sm'
								style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
							>
								{task.description}
							</Text>
						</Box>
					)}

					{(task.dueDate || task.scheduledDate || task.completedAt) && (
						<>
							<Divider />
							<Box>
								<Text size='sm' fw={500} mb='md' c='dimmed'>
									Timeline
								</Text>
								<Stack gap='sm'>
									{task.scheduledDate && (
										<Group gap='xs'>
											<IconCalendar size={16} opacity={0.6} />
											<Text size='sm' c='dimmed'>
												Scheduled:
											</Text>
											<Text size='sm'>{formatDate(task.scheduledDate)}</Text>
										</Group>
									)}
									{task.dueDate && (
										<Group gap='xs'>
											<IconCalendar size={16} opacity={0.6} />
											<Text size='sm' c='dimmed'>
												Due:
											</Text>
											<Text size='sm' fw={500}>
												{formatDate(task.dueDate)}
											</Text>
										</Group>
									)}
									{task.completedAt && (
										<Group gap='xs'>
											<IconCalendar size={16} opacity={0.6} />
											<Text size='sm' c='dimmed'>
												Completed:
											</Text>
											<Text size='sm'>{formatDateTime(task.completedAt)}</Text>
										</Group>
									)}
								</Stack>
							</Box>
						</>
					)}

					<Divider />

					<Box>
						<Text size='sm' fw={500} mb='md' c='dimmed'>
							People
						</Text>
						<Stack gap='md'>
							<Group gap='sm'>
								<IconUser size={16} opacity={0.6} />
								<Text size='sm' c='dimmed' w={80}>
									Created by
								</Text>
								<Group gap='xs'>
									<Avatar
										src={task.creator.image}
										alt={task.creator.name || 'User'}
										size='sm'
										radius='xl'
									/>
									<Text size='sm'>
										{task.creator.name || task.creator.email}
									</Text>
								</Group>
							</Group>

							{task.assignees.length > 0 && (
								<Group gap='sm'>
									<IconUser size={16} opacity={0.6} />
									<Text size='sm' c='dimmed' w={80}>
										Assigned to
									</Text>
									<AvatarGroup spacing='sm'>
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
									</AvatarGroup>
								</Group>
							)}
						</Stack>
					</Box>

					<Divider />

					<Box>
						<Group gap='xl'>
							<Box>
								<Text size='xs' c='dimmed' mb={4}>
									Created
								</Text>
								<Text size='sm'>{formatDateTime(task.createdAt)}</Text>
							</Box>
							<Box>
								<Text size='xs' c='dimmed' mb={4}>
									Updated
								</Text>
								<Text size='sm'>{formatDateTime(task.updatedAt)}</Text>
							</Box>
						</Group>
					</Box>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
