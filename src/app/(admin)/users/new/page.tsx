import { createUser, Form } from '@admin/users';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create User'} onSubmit={createUser} />
		</Box>
	);
}
