import { Box } from '@mantine/core';
import Form from '@/modules/registry/features/terms/components/Form';
import { createTerm } from '@/modules/registry/features/terms/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Term'} onSubmit={createTerm} />
		</Box>
	);
}
