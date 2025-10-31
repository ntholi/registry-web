'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';

type DeletePhotoModalProps = {
	onConfirm: () => void;
	studentName: string;
	renderTrigger?: (args: {
		open: () => void;
		close: () => void;
		opened: boolean;
	}) => React.ReactNode;
};

export default function DeletePhotoModal({
	onConfirm,
	studentName,
	renderTrigger,
}: DeletePhotoModalProps) {
	const [opened, { open, close }] = useDisclosure(false);

	const handleConfirm = () => {
		onConfirm();
		close();
	};

	return (
		<>
			{renderTrigger ? (
				renderTrigger({ open, close, opened })
			) : (
				<Button color='red' onClick={open} leftSection={<IconTrash size='1rem' />}>
					Delete Photo
				</Button>
			)}

			<Modal opened={opened} onClose={close} title='Delete Photo' centered size='sm'>
				<Stack gap='md'>
					<Text size='sm'>
						Are you sure you want to delete the photo for <strong>{studentName}</strong>? This
						action cannot be undone.
					</Text>

					<Group justify='flex-end' mt='md'>
						<Button variant='outline' onClick={close}>
							Cancel
						</Button>
						<Button color='red' onClick={handleConfirm}>
							Delete Photo
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
