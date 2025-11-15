import { Form } from '@academic/assessments';
import { createAssessment } from '@academic/assessments/server';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
