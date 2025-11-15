import { Form } from '@academic/semester-modules';
import { createModule } from '@academic/semester-modules/server';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Module'} onSubmit={createModule} />
		</Box>
	);
}
