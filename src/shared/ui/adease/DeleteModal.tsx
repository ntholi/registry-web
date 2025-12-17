'use client';

import { Box, Button, Group, Modal } from '@mantine/core';
import { useState } from 'react';
import DeleteConfirmContent from './DeleteConfirmContent';

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
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

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
		setIsConfirmed(false);
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
				<DeleteConfirmContent
					itemName={itemName}
					itemType={itemType}
					warningMessage={warningMessage}
					onConfirmChange={setIsConfirmed}
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
