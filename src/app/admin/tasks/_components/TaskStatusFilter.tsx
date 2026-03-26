'use client';

import { getTaskStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const statusOptions = [
	{ value: 'open', label: 'Open', color: 'gray' },
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'todo', label: 'To Do', color: getTaskStatusColor('todo') },
	{
		value: 'in_progress',
		label: 'In Progress',
		color: getTaskStatusColor('in_progress'),
	},
	{
		value: 'on_hold',
		label: 'On Hold',
		color: getTaskStatusColor('on_hold'),
	},
	{
		value: 'completed',
		label: 'Completed',
		color: getTaskStatusColor('completed'),
	},
	{
		value: 'cancelled',
		label: 'Cancelled',
		color: getTaskStatusColor('cancelled'),
	},
];

export default function TaskStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='open'
			options={statusOptions}
		/>
	);
}
