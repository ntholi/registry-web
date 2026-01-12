import { Box } from '@mantine/core';
import { createGraduation, Form } from '@registry/dates/graduations';
import { getAllTerms } from '@/app/registry/terms';

export default async function NewPage() {
	const terms = await getAllTerms();

	return (
		<Box p={'lg'}>
			<Form
				title={'Create Graduation'}
				onSubmit={createGraduation}
				terms={terms.map((t) => ({ id: t.id, code: t.code }))}
			/>
		</Box>
	);
}
