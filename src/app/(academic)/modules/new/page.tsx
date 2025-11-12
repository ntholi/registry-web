import { Box } from '@mantine/core';
import { createModule } from '@/server/academic/modules/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Module'} onSubmit={createModule} />
		</Box>
	);
}
