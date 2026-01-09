import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createCertificateType } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Certificate Type' onSubmit={createCertificateType} />
		</Box>
	);
}
