import { Box } from '@mantine/core';
import { createTerm, Form } from '@registry/terms';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Term'} onSubmit={createTerm} />
		</Box>
	);
}
