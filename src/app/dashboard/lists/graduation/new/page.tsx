import { Box } from '@mantine/core';
import { createGraduationList } from '@/server/lists/graduation/actions';
import Form from '../Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Graduation List'} onSubmit={createGraduationList} />
		</Box>
	);
}
