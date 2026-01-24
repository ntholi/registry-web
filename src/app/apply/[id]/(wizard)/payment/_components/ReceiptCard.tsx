'use client';

import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconReceipt, IconTrash, IconX } from '@tabler/icons-react';

export type UploadedReceipt = {
	id: string;
	receiptNumber: string | null;
	amount: number | null;
	dateIssued: string | null;
	isValid: boolean;
	errors: string[];
	base64: string;
	mediaType: string;
};

type Props = {
	receipt: UploadedReceipt;
	onDelete: () => void;
	deleting: boolean;
};

export function ReceiptCard({ receipt, onDelete, deleting }: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleConfirmDelete() {
		onDelete();
		close();
	}

	return (
		<>
			<DeleteReceiptModal
				opened={opened}
				onClose={close}
				onConfirm={handleConfirmDelete}
				deleting={deleting}
			/>

			<Card withBorder radius='md' p='md'>
				<Stack gap='sm'>
					<Group wrap='nowrap' justify='space-between'>
						<Group wrap='nowrap'>
							<ThemeIcon
								size='lg'
								variant='light'
								color={receipt.isValid ? 'green' : 'red'}
							>
								<IconReceipt size={20} />
							</ThemeIcon>
							<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
								<Text size='sm' fw={600}>
									Payment Receipt
								</Text>
								<Badge
									size='xs'
									color={receipt.isValid ? 'green' : 'red'}
									variant='light'
									leftSection={
										receipt.isValid ? (
											<IconCheck size={10} />
										) : (
											<IconX size={10} />
										)
									}
								>
									{receipt.isValid ? 'Valid' : 'Invalid'}
								</Badge>
							</Stack>
						</Group>
						<ActionIcon
							variant='subtle'
							color='red'
							onClick={open}
							disabled={deleting}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
					<Stack gap={4}>
						{receipt.receiptNumber && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Receipt #:
								</Text>
								<Text size='xs' fw={500}>
									{receipt.receiptNumber}
								</Text>
							</Group>
						)}
						{receipt.amount !== null && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Amount:
								</Text>
								<Text size='xs' fw={500}>
									M {receipt.amount.toFixed(2)}
								</Text>
							</Group>
						)}
						{receipt.dateIssued && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Date:
								</Text>
								<Text size='xs' fw={500}>
									{receipt.dateIssued}
								</Text>
							</Group>
						)}
						{!receipt.isValid && receipt.errors.length > 0 && (
							<Text size='xs' c='red' mt='xs'>
								{receipt.errors[0]}
							</Text>
						)}
					</Stack>
				</Stack>
			</Card>
		</>
	);
}

type DeleteModalProps = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	deleting: boolean;
};

function DeleteReceiptModal({
	opened,
	onClose,
	onConfirm,
	deleting,
}: DeleteModalProps) {
	return (
		<Modal opened={opened} onClose={onClose} title='Delete Receipt' centered>
			<Stack gap='md'>
				<Text size='sm'>
					Are you sure you want to delete this receipt? This action cannot be
					undone.
				</Text>
				<Group justify='flex-end'>
					<Button variant='subtle' onClick={onClose}>
						Cancel
					</Button>
					<Button color='red' onClick={onConfirm} loading={deleting}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
