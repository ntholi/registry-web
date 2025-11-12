import { Box } from '@mantine/core';
import { createTerm } from '@/server/registry/terms/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Term'} onSubmit={createTerm} />
		</Box>
	);
}
