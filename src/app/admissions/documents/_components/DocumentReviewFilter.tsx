'use client';

import { Select } from '@mantine/core';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

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
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Documents'
			title='Filter Documents'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
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
	);
}
