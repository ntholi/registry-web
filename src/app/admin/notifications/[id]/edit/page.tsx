import {
	Form,
	getNotification,
	getRecipientUserIds,
	updateNotification,
} from '@admin/notifications';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditNotificationPage({ params }: Props) {
	const { id } = await params;
	const notification = await getNotification(Number(id));

	if (!notification) {
		return notFound();
	}

	const recipientUserIds =
		notification.targetType === 'users'
			? await getRecipientUserIds(Number(id))
			: [];

	return (
		<Box p='lg'>
			<Form
				title='Edit Notification'
				defaultValues={{
					...notification,
					recipientUserIds,
				}}
				onSubmit={async (value) => {
					'use server';
					return await updateNotification(Number(id), value);
				}}
			/>
		</Box>
	);
}
