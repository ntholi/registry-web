import { Form } from '@academic/assessments';
import { Box } from '@mantine/core';
import { createAssessment } from '@/modules/academic/features/assessments/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
