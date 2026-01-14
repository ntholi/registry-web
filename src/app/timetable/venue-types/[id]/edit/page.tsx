import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getVenueType, updateVenueType } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueTypeEdit({ params }: Props) {
	const { id } = await params;
	const venueType = await getVenueType(id);

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
					const updated = await updateVenueType(id, value);
					if (!updated) {
						throw new Error('Failed to update venue type');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
