import { Box } from '@mantine/core';
import Form from '@/modules/finance/features/blocked-students/components/Form';
import { createBlockedStudent } from '@/modules/finance/features/blocked-students/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
		</Box>
	);
}
