'use client';

import { Badge, Group, Stack, Text } from '@mantine/core';
import {
	IconAlertCircle,
	IconCalendarClock,
	IconCheck,
	IconClock,
	IconHourglass,
	IconPlayerPlay,
	IconX,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getTasks, type TaskFilter } from '@/server/tasks/actions';
import TasksFilter from './TasksFilter';

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

function _getStatusColor(status: string) {
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

function getStatusIcon(status: string) {
	switch (status) {
		case 'completed':
			return <IconCheck size={'1rem'} color='var(--mantine-color-green-6)' />;
		case 'in_progress':
			return (
				<IconPlayerPlay size={'1rem'} color='var(--mantine-color-blue-6)' />
			);
		case 'active':
			return (
				<IconHourglass size={'1rem'} color='var(--mantine-color-yellow-6)' />
			);
		case 'scheduled':
			return (
				<IconCalendarClock size={'1rem'} color='var(--mantine-color-grape-6)' />
			);
		case 'cancelled':
			return <IconX size={'1rem'} color='var(--mantine-color-gray-6)' />;
		default:
			return <IconClock size={'1rem'} color='var(--mantine-color-gray-6)' />;
	}
}

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();

	const getTasksData = async (page: number, search: string) => {
		const filter: TaskFilter = {};

		const statusParam = searchParams.get('status');
		const priorityParam = searchParams.get('priority');

		if (statusParam) {
			filter.status = statusParam.split(',').filter(Boolean);
		} else {
			filter.status = ['active', 'in_progress'];
		}

		if (priorityParam) {
			filter.priority = priorityParam.split(',').filter(Boolean);
		}

		return getTasks(page, search, filter);
	};

	return (
		<ListLayout
			path={'/dashboard/tasks'}
			queryKey={['tasks', searchParams.toString()]}
			getData={getTasksData}
			actionIcons={[
				<TasksFilter key={'filter-link'} />,
				<NewLink key={'new-link'} href='/dashboard/tasks/new' />,
			]}
			renderItem={(task) => {
				const isOverdue =
					task.dueDate &&
					typeof task.dueDate === 'number' &&
					task.dueDate < Date.now() &&
					task.status !== 'completed';

				return (
					<ListItem
						id={task.id}
						label={
							<Stack gap={4}>
								<Group gap='xs'>
									<Text size='sm' fw={500} lineClamp={1}>
										{task.title}
									</Text>
									{isOverdue && <IconAlertCircle size={16} color='red' />}
								</Group>
								<Group gap='xs'>
									<Badge
										size='xs'
										variant='light'
										color={getPriorityColor(task.priority)}
									>
										{task.priority}
									</Badge>
									{task.dueDate && (
										<Group gap={4}>
											<IconClock size={12} />
											<Text size='xs' c='dimmed'>
												{formatDistanceToNow(new Date(task.dueDate), {
													addSuffix: true,
												})}
											</Text>
										</Group>
									)}
								</Group>
							</Stack>
						}
						rightSection={getStatusIcon(task.status)}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
