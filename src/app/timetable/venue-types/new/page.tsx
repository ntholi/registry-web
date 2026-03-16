import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import Form from '../_components/Form';
import { createVenueType } from '../_server/actions';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Venue Type'
				onSubmit={async (value) => {
					'use server';
					return unwrap(await createVenueType(value));
				}}
			/>
		</Box>
	);
}
