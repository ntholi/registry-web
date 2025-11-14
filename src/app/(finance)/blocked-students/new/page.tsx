import { Form } from '@finance/blocked-students';
import { Box } from '@mantine/core';
import { createBlockedStudent } from '@/modules/finance/features/blocked-students/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
		</Box>
	);
}
