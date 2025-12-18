import { createNotification, Form } from '@admin/notifications';
import { Box } from '@mantine/core';

export default function NewNotificationPage() {
	return (
		<Box p='lg'>
			<Form title='Create Notification' onSubmit={createNotification} />
		</Box>
	);
}
