import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createAssessment } from '../_server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Assessment'} onSubmit={createAssessment} />
		</Box>
	);
}
