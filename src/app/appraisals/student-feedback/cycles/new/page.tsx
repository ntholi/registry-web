import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createCycle } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Feedback Cycle' onSubmit={createCycle} />
		</Box>
	);
}
