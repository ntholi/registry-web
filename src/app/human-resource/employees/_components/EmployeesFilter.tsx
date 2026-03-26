'use client';

import { Select } from '@mantine/core';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

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
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Employees'
			title='Filter Employees'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
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
	);
}
