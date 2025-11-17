import { Box } from '@mantine/core';
import { Form, getVenueWithRelations, updateVenue } from '@timetable/venues';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueEdit({ params }: Props) {
	const { id } = await params;
	const venue = await getVenueWithRelations(Number(id));

	if (!venue) {
		return notFound();
	}

	const schoolIds = venue.venueSchools.map(
		(vs: { school: { id: number } }) => vs.school.id
	);

	return (
		<Box p='lg'>
			<Form
				title='Edit Venue'
				defaultValues={{
					...venue,
					schoolIds,
				}}
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...venueData } = value;
					const updated = await updateVenue(Number(id), venueData, schoolIds);
					if (!updated) {
						throw new Error('Failed to update venue');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
