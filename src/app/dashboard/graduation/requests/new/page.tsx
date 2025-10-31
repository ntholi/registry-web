import { Box } from '@mantine/core';
import { createGraduationRequest } from '@/server/graduation/requests/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Graduation Request'} onSubmit={createGraduationRequest} />
		</Box>
	);
}
