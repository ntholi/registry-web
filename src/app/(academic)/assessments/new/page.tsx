import { Box } from '@mantine/core';
import Form from '@/modules/academic/features/assessments/components/Form';
import { createAssessment } from '@/modules/academic/features/assessments/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
