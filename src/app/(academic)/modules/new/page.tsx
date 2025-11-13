import { Box } from '@mantine/core';
import Form from '@/modules/academic/features/modules/components/Form';
import { createModule } from '@/modules/academic/features/modules/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Module'} onSubmit={createModule} />
		</Box>
	);
}
