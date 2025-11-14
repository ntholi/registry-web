'use client';

import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getTasksByPriority, getTasksByStatus } from '../server/actions';

type TaskFilterViewProps = {
	filter: 'status' | 'priority';
	value: string;
};

function getPriorityColor(priority: string) {
	switch (priority) {
		case 'urgent':
			return 'red';
		case 'high':
			return 'orange';
		case 'medium':
			return 'yellow';
		case 'low':
			return 'blue';
		default:
			return 'gray';
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case 'completed':
			return 'green';
		case 'in_progress':
			return 'blue';
		case 'active':
			return 'cyan';
		case 'scheduled':
			return 'grape';
		case 'cancelled':
			return 'gray';
		default:
			return 'gray';
	}
}

export default function TaskFilterView({ filter, value }: TaskFilterViewProps) {
	const searchParams = useSearchParams();
	const search = searchParams.get('q') || '';
	const page = Number(searchParams.get('page')) || 1;

	const { data, isLoading } = useQuery({
		queryKey: ['tasks', filter, value, page, search],
		queryFn: async () => {
			if (filter === 'status') {
				return await getTasksByStatus(
					value as
						| 'scheduled'
						| 'active'
						| 'in_progress'
						| 'completed'
						| 'cancelled',
					page,
					search
				);
			} else {
				return await getTasksByPriority(
					value as 'low' | 'medium' | 'high' | 'urgent',
					page,
					search
				);
			}
		},
	});

	const tasks = data?.items || [];

	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	if (tasks.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Text c='dimmed' ta='center'>
					No {value} tasks found
				</Text>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{tasks.map((task) => {
				const isOverdue =
					task.dueDate &&
					typeof task.dueDate === 'number' &&
					task.dueDate < Date.now() &&
					task.status !== 'completed';

				return (
					<Paper
						key={task.id}
						withBorder
						p='md'
						component={Link}
						href={`/tasks/${task.id}`}
						style={{ textDecoration: 'none', cursor: 'pointer' }}
					>
						<Stack gap='xs'>
							<Group justify='space-between'>
								<Text size='sm' fw={500} lineClamp={1} style={{ flex: 1 }}>
									{task.title}
								</Text>
								{isOverdue && <IconAlertCircle size={16} color='red' />}
							</Group>

							{task.description && (
								<Text size='sm' c='dimmed' lineClamp={2}>
									{task.description}
								</Text>
							)}

							<Group gap='xs'>
								<Badge size='xs' color={getStatusColor(task.status)}>
									{task.status.replace('_', ' ')}
								</Badge>
								<Badge size='xs' color={getPriorityColor(task.priority)}>
									{task.priority}
								</Badge>
								{task.dueDate && (
									<Group gap={4}>
										<IconClock size={12} />
										<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
											{formatDistanceToNow(new Date(task.dueDate), {
												addSuffix: true,
											})}
										</Text>
									</Group>
								)}
							</Group>
						</Stack>
					</Paper>
				);
			})}
		</Stack>
	);
}
