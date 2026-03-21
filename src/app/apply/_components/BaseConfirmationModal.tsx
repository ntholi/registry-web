'use client';

import { Button, Group, Modal, type ModalProps, Stack } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

type Props = Pick<ModalProps, 'opened' | 'size'> & {
	title: string;
	onClose: () => void;
	onConfirm: () => void;
	loading?: boolean;
	children: React.ReactNode;
};

export function BaseConfirmationModal({
	opened,
	title,
	onClose,
	onConfirm,
	loading,
	size = 'md',
	children,
}: Props) {
	return (
		<Modal opened={opened} onClose={onClose} title={title} centered size={size}>
			<Stack gap='lg'>
				{children}
				<Group justify='space-between' gap='sm'>
					<Button
						variant='light'
						color='red'
						leftSection={<IconX size={16} />}
						onClick={onClose}
						disabled={loading}
					>
						Try Again
					</Button>
					<Button
						leftSection={<IconCheck size={16} />}
						onClick={onConfirm}
						loading={loading}
					>
						Confirm
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
