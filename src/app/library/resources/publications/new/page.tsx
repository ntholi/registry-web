import { Box } from '@mantine/core';
import PublicationForm from '../_components/Form';
import { createPublication } from '../_server/actions';

export default function NewPublicationPage() {
	return (
		<Box p={'pg'}>
			<PublicationForm onSubmit={createPublication} title='New Publication' />
		</Box>
	);
}
