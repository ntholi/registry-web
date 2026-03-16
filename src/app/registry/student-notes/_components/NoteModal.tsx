'use client';

import {
	ActionIcon,
	Anchor,
	Button,
	Divider,
	FileButton,
	Group,
	Modal,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { VISIBILITY_HINT, VISIBILITY_OPTIONS } from '../_lib/constants';
import type { NoteVisibility } from '../_schema/studentNotes';
import {
	createStudentNote,
	deleteNoteAttachment,
	updateStudentNote,
	uploadNoteAttachment,
} from '../_server/actions';
import type { StudentNoteRecord } from '../_server/repository';

type Props = {
	opened: boolean;
	onClose: () => void;
	stdNo: number;
	note?: StudentNoteRecord;
};

export default function NoteModal({ opened, onClose, stdNo, note }: Props) {
	const isEdit = !!note;
	const [content, setContent] = useState(note?.content ?? '');
	const [visibility, setVisibility] = useState<NoteVisibility>(
		note?.visibility ?? 'role'
	);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const queryClient = useQueryClient();

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ['student-notes', stdNo] });
	}

	async function uploadFiles(noteId: string, files: File[]) {
		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);
			unwrap(await uploadNoteAttachment(stdNo, noteId, formData));
		}
	}

	const saveMutation = useActionMutation(
		async () => {
			if (isEdit) {
				return updateStudentNote(note.id, content, visibility);
			}
			const created = await createStudentNote(stdNo, content, visibility);
			if (!created.success) {
				return created;
			}
			if (pendingFiles.length > 0) {
				await uploadFiles(created.data.id, pendingFiles);
			}
			return created;
		},
		{
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: ['student-notes', stdNo],
				});
				if (!isEdit) {
					setContent('');
					setVisibility('role');
					setPendingFiles([]);
				}
				onClose();
				notifications.show({
					title: 'Success',
					message: isEdit ? 'Note updated' : 'Note created',
					color: 'green',
				});
			},
			onError: (error: Error) => {
				notifications.show({
					title: 'Error',
					message: error.message,
					color: 'red',
				});
			},
		}
	);

	const uploadMutation = useActionMutation(
		(file: File) => {
			const formData = new FormData();
			formData.append('file', file);
			return uploadNoteAttachment(stdNo, note!.id, formData);
		},
		{
			onSuccess: invalidate,
			onError: (error: Error) => {
				notifications.show({
					title: 'Error',
					message: error.message,
					color: 'red',
				});
			},
		}
	);

	const deleteAttachmentMutation = useActionMutation(deleteNoteAttachment, {
		onSuccess: invalidate,
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleClose() {
		if (!saveMutation.isPending) {
			if (!isEdit) {
				setContent('');
				setVisibility('role');
				setPendingFiles([]);
			}
			onClose();
		}
	}

	function addPendingFile(file: File | null) {
		if (file) setPendingFiles((prev) => [...prev, file]);
	}

	function removePendingFile(index: number) {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	}

	const isEmpty = !content.trim() || content === '<p></p>';

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={isEdit ? 'Edit Note' : 'Create Note'}
			size='xl'
			centered
		>
			<Stack gap='md'>
				<RichTextField
					toolbar='normal'
					placeholder='Write a note...'
					value={content}
					onChange={setContent}
					height={280}
					showFullScreenButton={false}
				/>
				<Stack gap={4}>
					<Text size='sm' fw={500}>
						Visibility
					</Text>
					<SegmentedControl
						size='xs'
						data={VISIBILITY_OPTIONS}
						value={visibility}
						onChange={(val) => setVisibility(val as NoteVisibility)}
					/>
					<Text size='xs' c='dimmed'>
						{VISIBILITY_HINT[visibility]}
					</Text>
				</Stack>

				<Stack gap='xs'>
					<Divider
						label={
							<Text size='xs' c='dimmed'>
								Attachments
							</Text>
						}
						labelPosition='left'
					/>
					<Group gap='xs' align='center'>
						<FileButton
							onChange={
								isEdit ? (f) => f && uploadMutation.mutate(f) : addPendingFile
							}
							accept='application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
						>
							{(props) => (
								<Button
									{...props}
									variant='default'
									size='xs'
									leftSection={<IconPaperclip size={12} />}
									loading={uploadMutation.isPending}
								>
									Add Attachment
								</Button>
							)}
						</FileButton>
						{isEdit &&
							note.attachments.length === 0 &&
							pendingFiles.length === 0 && (
								<Text size='xs' c='dimmed'>
									No attachments yet
								</Text>
							)}
						{!isEdit && pendingFiles.length === 0 && (
							<Text size='xs' c='dimmed'>
								No attachments yet
							</Text>
						)}
					</Group>

					{isEdit && note.attachments.length > 0 && (
						<Stack gap={4}>
							{note.attachments.map((a) => (
								<Paper key={a.id} px='xs' py={6} withBorder>
									<Group justify='space-between'>
										<Group gap='xs'>
											<IconFile
												size={14}
												style={{ color: 'var(--mantine-color-dimmed)' }}
											/>
											<Anchor
												href={getPublicUrl(a.fileKey)}
												target='_blank'
												size='xs'
											>
												{a.fileName}
											</Anchor>
										</Group>
										<ActionIcon
											size='xs'
											variant='subtle'
											color='red'
											onClick={() => deleteAttachmentMutation.mutate(a.id)}
											loading={deleteAttachmentMutation.isPending}
										>
											<IconX size={12} />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</Stack>
					)}

					{!isEdit && pendingFiles.length > 0 && (
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							{pendingFiles.map((file, i) => (
								<Paper key={`${file.name}-${i}`} p='md' withBorder>
									<Group justify='space-between'>
										<Group gap='xs'>
											<IconFile
												size={14}
												style={{ color: 'var(--mantine-color-dimmed)' }}
											/>
											<Text size='xs'>{file.name}</Text>
										</Group>
										<ActionIcon
											size='xs'
											variant='subtle'
											color='red'
											onClick={() => removePendingFile(i)}
										>
											<IconX size={12} />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</SimpleGrid>
					)}
				</Stack>

				<Group justify='flex-end' gap='xs'>
					<Button
						variant='default'
						size='sm'
						onClick={handleClose}
						disabled={saveMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						size='sm'
						onClick={() => saveMutation.mutate()}
						loading={saveMutation.isPending}
						disabled={isEmpty}
					>
						{isEdit ? 'Save Changes' : 'Create Note'}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
