import { Box } from '@mantine/core';
import { createSponsor } from '@/server/sponsors/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Sponsor'} onSubmit={createSponsor} />
		</Box>
	);
}
