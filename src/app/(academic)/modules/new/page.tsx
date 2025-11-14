import { Form } from '@academic/modules';
import { Box } from '@mantine/core';
import { createModule } from '@/modules/academic/features/modules/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Module'} onSubmit={createModule} />
		</Box>
	);
}
