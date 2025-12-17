'use client';

import {
	Alert,
	Box,
	Button,
	Group,
	Modal,
	Text,
	TextInput,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';

export type DeleteModalProps = {
	opened: boolean;
	onClose: () => void;
	onDelete: () => Promise<void>;
	itemName: string;
	itemType: string;
	warningMessage?: string;
	title?: string;
};

export function DeleteModal({
	opened,
	onClose,
	onDelete,
	itemName,
	itemType,
	warningMessage,
	title = `Delete ${itemType}`,
}: DeleteModalProps) {
	const [confirmValue, setConfirmValue] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	const isConfirmed = confirmValue === 'delete permanently';

	async function handleDelete() {
		if (!isConfirmed) return;

		try {
			setIsDeleting(true);
			await onDelete();
			handleClose();
		} finally {
			setIsDeleting(false);
		}
	}

	function handleClose() {
		setConfirmValue('');
		setIsDeleting(false);
		onClose();
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={title}
			size='md'
			centered
		>
			<Box mb='md'>
				<Alert
					icon={<IconAlertTriangle size={16} />}
					title='Warning'
					color='red'
					mb='md'
				>
					<Text fw={500} mb='xs'>
						You are about to delete {itemType} "{itemName}".
					</Text>
					<Text size='sm'>
						{warningMessage ||
							'This will permanently remove all associated data. This action cannot be undone.'}
					</Text>
				</Alert>

				<Text size='sm' mb='md'>
					To confirm deletion, please type{' '}
					<Text span fw={700}>
						delete permanently
					</Text>{' '}
					in the field below:
				</Text>

				<TextInput
					placeholder='delete permanently'
					value={confirmValue}
					onChange={(e) => setConfirmValue(e.target.value)}
					data-autofocus
				/>
			</Box>

			<Group justify='right' mt='xl'>
				<Button variant='outline' onClick={handleClose}>
					Cancel
				</Button>
				<Button
					color='red'
					onClick={handleDelete}
					disabled={!isConfirmed}
					loading={isDeleting}
				>
					Delete
				</Button>
			</Group>
		</Modal>
	);
}
