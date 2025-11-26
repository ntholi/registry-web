import { Box } from '@mantine/core';
import { Form, getVenueType, updateVenueType } from '@timetable/venue-types';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueTypeEdit({ params }: Props) {
	const { id } = await params;
	const venueType = await getVenueType(Number(id));

	if (!venueType) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Venue Type'
				defaultValues={venueType}
				onSubmit={async (value) => {
					'use server';
					const updated = await updateVenueType(Number(id), value);
					if (!updated) {
						throw new Error('Failed to update venue type');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
