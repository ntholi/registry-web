import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getVenueWithRelations, updateVenue } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueEdit({ params }: Props) {
	const { id } = await params;
	const venue = await getVenueWithRelations(id);

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
					const updated = await updateVenue(id, venueData, schoolIds);
					if (!updated) {
						throw new Error('Failed to update venue');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
