import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import {
	getNotification,
	getRecipientUserIds,
	updateNotification,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditNotificationPage({ params }: Props) {
	const { id } = await params;
	const notification = unwrap(await getNotification(Number(id)));

	if (!notification) {
		return notFound();
	}

	const recipientUserIds =
		notification.targetType === 'users'
			? unwrap(await getRecipientUserIds(Number(id)))
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
					return unwrap(await updateNotification(Number(id), value));
				}}
			/>
		</Box>
	);
}
