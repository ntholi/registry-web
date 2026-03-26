'use client';

import { getStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'pending', label: 'Pending', color: getStatusColor('pending') },
	{ value: 'approved', label: 'Approved', color: getStatusColor('approved') },
	{ value: 'rejected', label: 'Rejected', color: getStatusColor('rejected') },
];

export default function GraduationRequestStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='all'
			options={options}
		/>
	);
}
