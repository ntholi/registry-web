import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createNotification } from '../_server/actions';

export default function NewNotificationPage() {
	return (
		<Box p='lg'>
			<Form title='Create Notification' onSubmit={createNotification} />
		</Box>
	);
}
