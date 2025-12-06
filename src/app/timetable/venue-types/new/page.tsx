import { Box } from '@mantine/core';
import { createVenueType, Form } from '@timetable/venue-types';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Venue Type' onSubmit={createVenueType} />
		</Box>
	);
}
