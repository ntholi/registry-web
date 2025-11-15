import { Form } from '@finance/blocked-students';
import { createBlockedStudent } from '@finance/blocked-students/server';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
		</Box>
	);
}
