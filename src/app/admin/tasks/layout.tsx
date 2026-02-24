'use client';

import { findAllTasks, type TaskWithRelations } from '@admin/tasks';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { IconCalendar, IconSchool, IconUser } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import {
	getTaskPriorityColor,
	getTaskStatusColor,
} from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import TaskStatusFilter from './_components/TaskStatusFilter';

type TaskStatusFilterValue =
	| 'all'
	| 'open'
	| 'todo'
	| 'in_progress'
	| 'on_hold'
	| 'completed'
	| 'cancelled';

const statusLabels: Record<string, string> = {
	todo: 'To Do',
	in_progress: 'In Progress',
	on_hold: 'On Hold',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

export default function Layout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter =
		(searchParams.get('status') as TaskStatusFilterValue | null) || 'open';

	async function fetchTasks(page: number, search: string) {
		return findAllTasks(page, search, statusFilter);
	}

	function handleStatusChange(value: TaskStatusFilterValue) {
		const params = new URLSearchParams(searchParams);
		if (value === 'open') {
			params.delete('status');
		} else {
			params.set('status', value);
		}
		params.delete('page');
		const query = params.toString();
		router.push(query ? `/admin/tasks?${query}` : '/admin/tasks');
	}

	return (
		<ListLayout<TaskWithRelations>
			path={'/admin/tasks'}
			queryKey={['tasks', statusFilter]}
			getData={fetchTasks}
			actionIcons={[
				<TaskStatusFilter
					key='status-filter'
					value={statusFilter}
					onChange={handleStatusChange}
				/>,
				<NewLink key={'new-link'} href='/admin/tasks/new' />,
			]}
			renderItem={(task) => (
				<ListItem
					id={task.id}
					label={
						<Stack gap={4}>
							<Group gap='xs' justify='space-between'>
								<Text size='sm' fw={500} lineClamp={1} style={{ flex: 1 }}>
									{task.title}
								</Text>
								<Badge
									size='xs'
									color={getTaskPriorityColor(task.priority)}
									variant='dot'
								>
									{task.priority}
								</Badge>
							</Group>
							<Group gap='xs'>
								<Badge
									size='xs'
									color={getTaskStatusColor(task.status)}
									variant={task.status === 'todo' ? 'light' : 'dot'}
								>
									{statusLabels[task.status]}
								</Badge>
								{task.dueDate && (
									<Badge size='xs' variant='light' color='gray'>
										<Group gap={4}>
											<IconCalendar size={10} />
											{formatDate(task.dueDate, 'short')}
										</Group>
									</Badge>
								)}
								{task.assignees?.length > 0 && (
									<Badge size='xs' variant='light' color='gray'>
										<Group gap={4}>
											<IconUser size={10} />
											{task.assignees.length}
										</Group>
									</Badge>
								)}
								{task.students?.length > 0 && (
									<Badge size='xs' variant='light' color='cyan'>
										<Group gap={4}>
											<IconSchool size={10} />
											{task.students.length}
										</Group>
									</Badge>
								)}
							</Group>
						</Stack>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
