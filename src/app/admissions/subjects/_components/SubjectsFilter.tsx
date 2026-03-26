'use client';

import { FilterMenu } from '@/shared/ui/adease';

const lqfLevelOptions = [
	{ value: '1', label: 'Level 1' },
	{ value: '2', label: 'Level 2' },
	{ value: '3', label: 'Level 3' },
	{ value: '4', label: 'Level 4 (Secondary)' },
	{ value: '5', label: 'Level 5' },
	{ value: '6', label: 'Level 6' },
	{ value: '7', label: 'Level 7' },
	{ value: '8', label: 'Level 8' },
	{ value: '9', label: 'Level 9' },
	{ value: '10', label: 'Level 10' },
	{ value: 'null', label: 'Not Set' },
];

export default function SubjectsFilter() {
	return (
		<FilterMenu
			label='LQF Level'
			queryParam='lqfLevel'
			defaultValue='4'
			options={lqfLevelOptions}
		/>
	);
}
