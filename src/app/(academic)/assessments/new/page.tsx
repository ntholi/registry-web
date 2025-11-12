import { Box } from '@mantine/core';
import { createAssessment } from '@/server/academic/assessments/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
