import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createVenueType } from '../_server/actions';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Venue Type' onSubmit={createVenueType} />
		</Box>
	);
}
