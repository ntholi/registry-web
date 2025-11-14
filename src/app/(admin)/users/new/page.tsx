import { Form } from '@admin/users';
import { Box } from '@mantine/core';
import { createUser } from '@/modules/admin/features/users/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create User'} onSubmit={createUser} />
		</Box>
	);
}
