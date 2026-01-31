import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createRecognizedSchool } from '../_server/actions';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Recognized School'
				onSubmit={createRecognizedSchool}
			/>
		</Box>
	);
}
