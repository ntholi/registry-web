import { Box } from '@mantine/core';
import { createVenue, Form } from '@timetable/venues';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Venue'
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...venue } = value;
					return await createVenue(venue, schoolIds ?? []);
				}}
			/>
		</Box>
	);
}
