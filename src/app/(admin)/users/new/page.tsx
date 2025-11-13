import { Box } from '@mantine/core';
import Form from '@/modules/admin/features/users/components/Form';
import { createUser } from '@/modules/admin/features/users/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create User'} onSubmit={createUser} />
		</Box>
	);
}
