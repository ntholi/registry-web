'use client';

import { Select } from '@mantine/core';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

const statusOptions = [
	{ value: '', label: 'All' },
	{ value: 'sent', label: 'Sent' },
	{ value: 'failed', label: 'Failed' },
];

const triggerOptions = [
	{ value: '', label: 'All' },
	{ value: 'manual', label: 'Manual' },
	{ value: 'reply', label: 'Reply' },
	{ value: 'student_status_created', label: 'Status Created' },
	{ value: 'student_status_updated', label: 'Status Updated' },
	{ value: 'student_status_approved', label: 'Status Approved' },
	{ value: 'student_status_rejected', label: 'Status Rejected' },
	{ value: 'notification_mirror', label: 'Notification Mirror' },
];

const filterConfig = [{ key: 'status' }, { key: 'triggerType' }];

export default function SentFilter() {
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Sent Mail'
			title='Filter Sent Mail'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			<Select
				label='Status'
				placeholder='All statuses'
				data={statusOptions}
				value={filters.status || null}
				onChange={(v) => setFilter('status', v)}
				clearable
			/>
			<Select
				label='Trigger Type'
				placeholder='All types'
				data={triggerOptions}
				value={filters.triggerType || null}
				onChange={(v) => setFilter('triggerType', v)}
				clearable
			/>
		</FilterModal>
	);
}
