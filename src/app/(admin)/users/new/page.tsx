import { Box } from '@mantine/core';
import { createUser } from '@/server/users/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create User'} onSubmit={createUser} />
		</Box>
	);
}
