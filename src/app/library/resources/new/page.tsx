import { Box } from '@mantine/core';
import ResourceForm from '../_components/Form';

export default function NewResourcePage() {
	return (
		<Box p='lg'>
			<ResourceForm title='Upload New Resource' />
		</Box>
	);
}
