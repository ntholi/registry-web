import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createStudentStatus } from '../_server/actions';

export default function NewPage() {
	async function handleSubmit(
		values: Parameters<typeof createStudentStatus>[0]
	) {
		const result = await createStudentStatus(values);
		if (!result) throw new Error('Failed to create application');
		return result;
	}

	return (
		<Box p='lg'>
			<Form title='New Application' onSubmit={handleSubmit} />
		</Box>
	);
}
