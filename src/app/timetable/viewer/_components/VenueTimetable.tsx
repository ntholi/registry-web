'use client';

import { Center, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import TimetableGrid from '@timetable/_shared/components/TimetableGrid';
import { getAllVenues } from '@timetable/venues';
import { useState } from 'react';
import { getVenueTimetableSlots } from '../_server/actions';

type Props = {
	termId: number;
};

export default function VenueTimetable({ termId }: Props) {
	const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

	const { data: venues = [] } = useQuery({
		queryKey: ['venues-select'],
		queryFn: () => getAllVenues(),
	});

	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['venue-timetable', selectedVenueId, termId],
		queryFn: () => getVenueTimetableSlots(selectedVenueId!, termId),
		enabled: !!selectedVenueId,
	});

	return (
		<Stack gap='md'>
			<Select
				label='Venue'
				placeholder='Search for a venue'
				searchable
				data={venues.map((venue) => ({
					value: venue.id.toString(),
					label: venue.name,
				}))}
				value={selectedVenueId ? selectedVenueId.toString() : null}
				onChange={(value) => setSelectedVenueId(value ? Number(value) : null)}
				clearable
				w={400}
			/>

			{!selectedVenueId ? (
				<Center h={400}>
					<Text c='dimmed'>Select a venue to view its timetable</Text>
				</Center>
			) : (
				<TimetableGrid
					slots={slots}
					isLoading={isLoading}
					emptyMessage='No timetable found for this venue.'
					showVenue={false}
					showClass
					showLecturer
				/>
			)}
		</Stack>
	);
}
