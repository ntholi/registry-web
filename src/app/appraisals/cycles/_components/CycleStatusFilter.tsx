'use client';

import { getStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'upcoming', label: 'Upcoming', color: getStatusColor('upcoming') },
	{ value: 'open', label: 'Open', color: getStatusColor('open') },
	{ value: 'closed', label: 'Closed', color: getStatusColor('closed') },
];

export default function CycleStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='all'
			options={options}
		/>
	);
}
