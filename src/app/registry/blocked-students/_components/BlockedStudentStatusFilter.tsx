'use client';

import { getStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'blocked', label: 'Blocked', color: getStatusColor('blocked') },
	{
		value: 'unblocked',
		label: 'Unblocked',
		color: getStatusColor('unblocked'),
	},
];

export default function BlockedStudentStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='blocked'
			options={options}
		/>
	);
}
