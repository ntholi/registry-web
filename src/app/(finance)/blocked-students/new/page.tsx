import { Box } from '@mantine/core';
import { createBlockedStudent } from '@/server/finance/blocked-students/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
		</Box>
	);
}
