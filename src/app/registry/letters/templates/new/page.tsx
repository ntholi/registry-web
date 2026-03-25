import { Box } from '@mantine/core';
import { createLetterTemplate } from '../../_server/actions';
import Form from '../_components/Form';

export default function NewTemplatePage() {
	return (
		<Box p='lg'>
			<Form title='Create Template' onSubmit={createLetterTemplate} />
		</Box>
	);
}
