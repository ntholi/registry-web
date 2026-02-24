'use client';

import { getTodoTaskSummary } from '@admin/tasks';
import { ActionIcon, Indicator } from '@mantine/core';
import { IconChecklist } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';

export default function TaskBell() {
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: ['tasks', 'todo-summary'],
		queryFn: getTodoTaskSummary,
		refetchInterval: 60000,
	});

	const todoCount = data?.todoCount ?? 0;
	const hasUrgentTodo = data?.hasUrgentTodo ?? false;

	return (
		<Indicator
			inline
			label={todoCount > 9 ? '9+' : todoCount}
			size={18}
			disabled={todoCount === 0}
			color='red'
			processing={isLoading || hasUrgentTodo}
		>
			<ActionIcon
				variant='default'
				size='lg'
				onClick={() => router.push('/admin/tasks')}
				aria-label='Tasks'
			>
				<IconChecklist size={20} />
			</ActionIcon>
		</Indicator>
	);
}
