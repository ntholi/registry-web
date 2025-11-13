'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { deleteDocument as deleteFromStorage } from '@/core/integrations/storage';
import { deleteDocument } from '@/modules/registry/features/documents/server/actions';

type DeleteDocumentModalProps = {
	opened: boolean;
	onClose: () => void;
	document: {
		id: string;
		fileName: string;
	};
	onSuccess: () => void;
};

export default function DeleteDocumentModal({
	opened,
	onClose,
	document,
	onSuccess,
}: DeleteDocumentModalProps) {
	const [loading, setLoading] = useState(false);
	const displayName = document.fileName.split('/').pop() || document.fileName;

	async function handleDelete() {
		try {
			setLoading(true);

			await deleteFromStorage(document.fileName);

			await deleteDocument(document.id);

			notifications.show({
				title: 'Success',
				message: 'Document deleted successfully',
				color: 'green',
			});

			onSuccess();
		} catch (error) {
			console.error('Error deleting document:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to delete document',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Delete Document'
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
		>
			<Stack gap='md'>
				<Text>
					Are you sure you want to delete this document? This action cannot be
					undone.
				</Text>
				<Text fw={500}>{displayName}</Text>

				<Group justify='flex-end' mt='md'>
					<Button variant='subtle' onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button color='red' onClick={handleDelete} loading={loading}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
