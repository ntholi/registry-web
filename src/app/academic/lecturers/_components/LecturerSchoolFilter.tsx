'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import { useQuery } from '@tanstack/react-query';
import { FilterMenu } from '@/shared/ui/adease';

export default function LecturerSchoolFilter() {
	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	const options = [
		{ value: 'all', label: 'All Schools' },
		...schools.map((s: { id: number; name: string }) => ({
			value: s.id.toString(),
			label: s.name,
		})),
	];

	return (
		<FilterMenu
			label='School'
			queryParam='schoolId'
			defaultValue='all'
			options={options}
		/>
	);
}
