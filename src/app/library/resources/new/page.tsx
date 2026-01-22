import { Box } from '@mantine/core';
import ResourceForm from '../_components/Form';
import { createResource } from '../_server/actions';

export default function NewResourcePage() {
	return (
		<Box p='lg'>
			<ResourceForm onSubmit={createResource} title='Upload New Resource' />;
		</Box>
	);
}
