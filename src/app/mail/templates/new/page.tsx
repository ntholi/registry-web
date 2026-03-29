import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createMailTemplate } from '../_server/actions';

export default function NewMailTemplatePage() {
	return (
		<Box p='lg'>
			<Form title='Create Mail Template' onSubmit={createMailTemplate} />
		</Box>
	);
}
