'use client';

import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'true', label: 'Active', color: 'green' },
	{ value: 'false', label: 'Inactive', color: 'gray' },
];

export default function RecognizedSchoolActiveFilter() {
	return (
		<FilterMenu
			label='Active'
			queryParam='active'
			defaultValue='all'
			options={options}
		/>
	);
}
