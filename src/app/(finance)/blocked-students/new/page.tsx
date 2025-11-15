import { createBlockedStudent, Form } from '@finance/blocked-students';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
		</Box>
	);
}
