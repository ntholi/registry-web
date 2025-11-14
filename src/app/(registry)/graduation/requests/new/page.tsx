import { Box } from '@mantine/core';
import { Form } from '@registry/graduation';
import { createGraduationRequest } from '@registry/graduation/clearance';

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
