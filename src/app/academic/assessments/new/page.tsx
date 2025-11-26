import { createAssessment, Form } from '@academic/assessments';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
