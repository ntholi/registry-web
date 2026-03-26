'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types/_server/actions';
import { FilterMenu } from '@/shared/ui/adease';

export default function VenueTypeFilter() {
	const { data: types = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
	});

	const options = [
		{ value: 'all', label: 'All Types' },
		...types.map((t) => ({
			value: t.id,
			label: t.name,
		})),
	];

	return (
		<FilterMenu
			label='Venue Type'
			queryParam='typeId'
			defaultValue='all'
			options={options}
		/>
	);
}
