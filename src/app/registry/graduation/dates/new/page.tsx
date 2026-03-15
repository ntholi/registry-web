import { Box } from '@mantine/core';
import { createGraduation, Form } from '@registry/graduation/dates';
import { getAllTerms } from '@/app/registry/terms';
import { unwrap } from '@/shared/lib/utils/actionResult';

export default async function NewPage() {
	const terms = unwrap(await getAllTerms());

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
