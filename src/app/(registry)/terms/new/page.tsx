import { Box } from '@mantine/core';
import { Form } from '@registry/terms';
import { createTerm } from '@registry/terms/server';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Term'} onSubmit={createTerm} />
		</Box>
	);
}
