import { Box } from '@mantine/core';
import { createSignup } from '@/server/signups/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Signup'} onSubmit={createSignup} />
		</Box>
	);
}
