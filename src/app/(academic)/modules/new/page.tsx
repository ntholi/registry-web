import { Form } from '@academic/modules';
import { createModule } from '@academic/modules/server';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Module'} onSubmit={createModule} />
		</Box>
	);
}
