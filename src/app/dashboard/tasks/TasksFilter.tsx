'use client';

import {
	ActionIcon,
	Button,
	Fieldset,
	Group,
	HoverCard,
	Modal,
	MultiSelect,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

const statusOptions = [
	{ value: 'scheduled', label: 'Scheduled' },
	{ value: 'active', label: 'Active' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

export default function TasksFilter() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const [statusFilter, setStatusFilter] = useQueryState('status');
	const [priorityFilter, setPriorityFilter] = useQueryState('priority');

	const [filters, setFilters] = useState({
		status: statusFilter || '',
		priority: priorityFilter || '',
	});

	useEffect(() => {
		setFilters({
			status: statusFilter || '',
			priority: priorityFilter || '',
		});
	}, [statusFilter, priorityFilter]);

	const previewDescription = useMemo(() => {
		const statusLabels = filters.status
			.split(',')
			.filter(Boolean)
			.map((s) => statusOptions.find((opt) => opt.value === s)?.label)
			.filter(Boolean);

		const priorityLabels = filters.priority
			.split(',')
			.filter(Boolean)
			.map((p) => priorityOptions.find((opt) => opt.value === p)?.label)
			.filter(Boolean);

		const parts: string[] = [];

		if (statusLabels.length > 0) {
			parts.push(statusLabels.join(', '));
		}

		if (priorityLabels.length > 0) {
			parts.push(`${priorityLabels.join(', ')} priority`);
		}

		if (parts.length === 0) {
			return 'All tasks';
		}

		return `${parts.join(' - ')} tasks`;
	}, [filters.status, filters.priority]);

	function handleApplyFilters() {
		setStatusFilter(filters.status || null);
		setPriorityFilter(filters.priority || null);
		close();
	}

	function handleClearFilters() {
		setFilters({
			status: '',
			priority: '',
		});
		setStatusFilter(null);
		setPriorityFilter(null);
		close();
	}

	const hasActiveFilters = statusFilter || priorityFilter;

	return (
		<>
			<HoverCard withArrow position='top'>
				<HoverCard.Target>
					<ActionIcon
						variant={hasActiveFilters ? 'white' : 'default'}
						size={33}
						onClick={toggle}
						color={hasActiveFilters ? 'blue' : undefined}
					>
						<IconFilter size={'1rem'} />
					</ActionIcon>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size='xs'>Filter Tasks</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			<Modal opened={opened} onClose={close} title='Filter Tasks' size='md'>
				<Stack gap='md'>
					<MultiSelect
						label='Status'
						placeholder='Select status'
						data={statusOptions}
						value={filters.status.split(',').filter(Boolean)}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								status: value.join(','),
							}))
						}
						clearable
					/>

					<MultiSelect
						label='Priority'
						placeholder='Select priority'
						data={priorityOptions}
						value={filters.priority.split(',').filter(Boolean)}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								priority: value.join(','),
							}))
						}
						clearable
					/>

					<Fieldset legend='Description'>
						<Text size='sm'>{previewDescription}</Text>
					</Fieldset>

					<Group justify='flex-end' gap='sm'>
						<Button variant='outline' onClick={handleClearFilters}>
							Clear All
						</Button>
						<Button onClick={handleApplyFilters}>Apply Filters</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
