'use client';

import { Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';
import { getTypeLabel } from '../_lib/labels';

const typeOptions = [
	{ value: 'withdrawal', label: getTypeLabel('withdrawal') },
	{ value: 'deferment', label: getTypeLabel('deferment') },
	{ value: 'reinstatement', label: getTypeLabel('reinstatement') },
];

const statusOptions = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'rejected', label: 'Rejected' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const filterConfig = [{ key: 'type' }, { key: 'status' }];

export default function StudentStatusesFilter() {
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
				label='Filter Student Statuses'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Student Statuses'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='Type'
					placeholder='All types'
					data={typeOptions}
					value={filters.type || null}
					onChange={(v) => setFilter('type', v)}
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
