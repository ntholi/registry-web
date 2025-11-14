import { Box } from '@mantine/core';
import { createGraduationRequest } from '@registry/graduation/clearance';
import Form from '@/modules/registry/features/graduation/requests/components/Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form
				title={'Create Graduation Request'}
				onSubmit={createGraduationRequest}
			/>
		</Box>
	);
}
