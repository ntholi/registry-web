'use client';

import { ActionIcon, Menu } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { getTaskStatusColor } from '@/shared/lib/utils/colors';
import type { TaskStatus } from '../_server/types';

type TaskStatusFilterValue = TaskStatus | 'all' | 'open';

interface TaskStatusOption {
	value: TaskStatusFilterValue;
	label: string;
}

interface Props {
	value: TaskStatusFilterValue;
	onChange: (value: TaskStatusFilterValue) => void;
}

const statusOptions: TaskStatusOption[] = [
	{ value: 'open', label: 'Open' },
	{ value: 'all', label: 'All' },
	{ value: 'todo', label: 'To Do' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

function getFilterColor(value: TaskStatusFilterValue) {
	if (value === 'open') return 'gray';
	if (value === 'all') return 'blue';
	return getTaskStatusColor(value);
}

export default function TaskStatusFilter({ value, onChange }: Props) {
	const color = getFilterColor(value);

	return (
		<Menu position='bottom-end'>
			<Menu.Target>
				<ActionIcon
					variant={value === 'open' ? 'default' : 'filled'}
					size={'lg'}
					color={color}
				>
					<IconFilter size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Status</Menu.Label>
				{statusOptions.map((option) => {
					const optionColor = getFilterColor(option.value);
					const isSelected = value === option.value;

					return (
						<Menu.Item
							key={option.value}
							onClick={() => onChange(option.value)}
							color={optionColor}
							bg={
								isSelected
									? `var(--mantine-color-${optionColor}-light)`
									: undefined
							}
						>
							{option.label}
						</Menu.Item>
					);
				})}
			</Menu.Dropdown>
		</Menu>
	);
}
