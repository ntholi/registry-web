'use client';

import {
	ActionIcon,
	Button,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconId, IconTrash } from '@tabler/icons-react';

export type UploadedIdentityDoc = {
	id: string;
	fileUrl?: string | null;
	fullName?: string | null;
	nationalId?: string | null;
	dateOfBirth?: string | null;
	nationality?: string | null;
	documentType?: string | null;
};

type Props = {
	doc: UploadedIdentityDoc;
	onDelete: () => void;
	deleting: boolean;
};

export function IdentityDocumentCard({ doc, onDelete, deleting }: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleConfirmDelete() {
		onDelete();
		close();
	}

	return (
		<>
			<DeleteIdentityModal
				opened={opened}
				onClose={close}
				onConfirm={handleConfirmDelete}
				deleting={deleting}
			/>

			<Card withBorder radius='md' p='md'>
				<Stack gap='sm'>
					<Group wrap='nowrap' justify='space-between'>
						<Group wrap='nowrap'>
							<ThemeIcon size='lg' variant='light' color='green'>
								<IconId size={20} />
							</ThemeIcon>
							<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
								<Text size='sm' fw={600}>
									Identity Document
								</Text>
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
						{doc.fullName && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Name:
								</Text>
								<Text size='xs' fw={500}>
									{doc.fullName}
								</Text>
							</Group>
						)}
						{doc.nationalId && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									ID Number:
								</Text>
								<Text size='xs' fw={500}>
									{doc.nationalId}
								</Text>
							</Group>
						)}
						{doc.dateOfBirth && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									DOB:
								</Text>
								<Text size='xs' fw={500}>
									{doc.dateOfBirth}
								</Text>
							</Group>
						)}
						{doc.nationality && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Nationality:
								</Text>
								<Text size='xs' fw={500}>
									{doc.nationality}
								</Text>
							</Group>
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

function DeleteIdentityModal({
	opened,
	onClose,
	onConfirm,
	deleting,
}: DeleteModalProps) {
	return (
		<Modal opened={opened} onClose={onClose} title='Delete Document' centered>
			<Stack gap='md'>
				<Text size='sm'>
					Are you sure you want to delete this identity document? This action
					cannot be undone.
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
