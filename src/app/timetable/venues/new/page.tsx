import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import Form from '../_components/Form';
import { createVenue } from '../_server/actions';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Venue'
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...venue } = value;
					return unwrap(await createVenue(venue, schoolIds ?? []));
				}}
			/>
		</Box>
	);
}
