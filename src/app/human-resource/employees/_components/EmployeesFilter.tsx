'use client';

import { Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const departmentOptions = [
	{ value: '', label: 'All' },
	{ value: 'Academic', label: 'Academic' },
	{ value: 'Finance', label: 'Finance' },
	{ value: 'Registry', label: 'Registry' },
	{ value: 'Library', label: 'Library' },
	{ value: 'Marketing', label: 'Marketing' },
	{ value: 'Student Services', label: 'Student Services' },
	{ value: 'LEAP', label: 'LEAP' },
	{ value: 'Human Resources', label: 'Human Resources' },
	{ value: 'Operations and Resources', label: 'Operations and Resources' },
];

const statusOptions = [
	{ value: '', label: 'All' },
	{ value: 'Active', label: 'Active' },
	{ value: 'Suspended', label: 'Suspended' },
	{ value: 'Terminated', label: 'Terminated' },
	{ value: 'Retired', label: 'Retired' },
	{ value: 'Deceased', label: 'Deceased' },
];

const filterConfig = [{ key: 'department' }, { key: 'status' }];

export default function EmployeesFilter() {
	const [opened, { open, close }] = useDisclosure(false);
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	function handleOpen() {
		sync();
		open();
	}

	function handleApply() {
		applyFilters();
		close();
	}

	function handleClear() {
		clearFilters();
		close();
	}

	return (
		<>
			<FilterButton
				label='Filter Employees'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Employees'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='Department'
					placeholder='All departments'
					data={departmentOptions}
					value={filters.department || null}
					onChange={(v) => setFilter('department', v)}
					searchable
					clearable
				/>
				<Select
					label='Status'
					placeholder='All statuses'
					data={statusOptions}
					value={filters.status || null}
					onChange={(v) => setFilter('status', v)}
					clearable
				/>
			</FilterModal>
		</>
	);
}
