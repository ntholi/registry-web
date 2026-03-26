'use client';

import { FilterMenu } from '@/shared/ui/adease';

const statusOptions = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

export default function DepositStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='pending'
			options={statusOptions}
		/>
	);
}
