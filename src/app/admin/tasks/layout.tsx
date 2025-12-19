'use client';

import { findAllTasks, type TaskWithRelations } from '@admin/tasks';
import { Badge, Group, Stack, Text } from '@mantine/core';
import {
	getTaskPriorityColor,
	getTaskStatusColor,
} from '@student-portal/utils';
import { IconCalendar, IconSchool, IconUser } from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

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
		month: 'short',
		day: 'numeric',
	});
}

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<TaskWithRelations>
			path={'/admin/tasks'}
			queryKey={['tasks']}
			getData={findAllTasks}
			actionIcons={[<NewLink key={'new-link'} href='/admin/tasks/new' />]}
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
											{formatDate(task.dueDate)}
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
