'use client';

import { getStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'draft', label: 'Draft', color: getStatusColor('draft') },
	{ value: 'submitted', label: 'Submitted', color: 'blue' },
	{
		value: 'acknowledged',
		label: 'Acknowledged',
		color: getStatusColor('approved'),
	},
];

export default function ObservationStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='all'
			options={options}
		/>
	);
}
