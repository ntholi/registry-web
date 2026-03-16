import { Box } from '@mantine/core';
import { unwrap } from '@/shared/lib/actions/actionResult';
import PublicationForm from '../_components/Form';
import { createPublication } from '../_server/actions';

export default function NewPublicationPage() {
	return (
		<Box p={'pg'}>
			<PublicationForm
				onSubmit={async (data) => {
					'use server';
					return unwrap(await createPublication(data));
				}}
				title='New Publication'
			/>
		</Box>
	);
}
