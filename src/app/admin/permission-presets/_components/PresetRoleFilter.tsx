'use client';

import { toTitleCase } from '@/shared/lib/utils/utils';
import { FilterMenu } from '@/shared/ui/adease';

const roles = [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'marketing',
	'student_services',
	'admin',
	'leap',
	'human_resource',
] as const;

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	...roles.map((role) => ({ value: role, label: toTitleCase(role) })),
];

export default function PresetRoleFilter() {
	return (
		<FilterMenu
			label='Role'
			queryParam='role'
			defaultValue='all'
			options={options}
		/>
	);
}
