'use client';

import { Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const statusOptions = [
	{ value: 'all', label: 'All Status' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

const typeOptions = [
	{ value: 'all', label: 'All Types' },
	{ value: 'identity', label: 'Identity' },
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'academic_record', label: 'Academic Record' },
];

const filterConfig = [
	{ key: 'status', defaultValue: 'pending' },
	{ key: 'type', defaultValue: 'all' },
];

export default function DocumentReviewFilter() {
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
				label='Filter Documents'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Documents'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='Verification Status'
					placeholder='Select status'
					data={statusOptions}
					value={filters.status || 'pending'}
					onChange={(value) => setFilter('status', value || 'pending')}
					clearable
				/>
				<Select
					label='Document Type'
					placeholder='Select type'
					data={typeOptions}
					value={filters.type || 'all'}
					onChange={(value) => setFilter('type', value || 'all')}
					clearable
				/>
			</FilterModal>
		</>
	);
}
