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
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { NoteVisibility } from '@/app/registry/student-notes/_schema/studentNotes';
import {
	createStudentNote,
	deleteNoteAttachment,
	updateStudentNote,
	uploadNoteAttachment,
} from '@/app/registry/student-notes/_server/actions';
import type { StudentNoteRecord } from '@/app/registry/student-notes/_server/repository';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import RichTextField from '@/shared/ui/adease/RichTextField';

type Props = {
	opened: boolean;
	onClose: () => void;
	stdNo: number;
	note?: StudentNoteRecord;
};

const VISIBILITY_OPTIONS = [
	{ label: 'My Department', value: 'role' },
	{ label: 'Only Me', value: 'self' },
	{ label: 'Everyone', value: 'everyone' },
];

export default function NoteModal({ opened, onClose, stdNo, note }: Props) {
	const isEdit = !!note;
	const [content, setContent] = useState(note?.content ?? '');
	const [visibility, setVisibility] = useState<NoteVisibility>(
		note?.visibility ?? 'role'
	);
	const queryClient = useQueryClient();

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ['student-notes', stdNo] });
	}

	const saveMutation = useMutation({
		mutationFn: () =>
			isEdit
				? updateStudentNote(note.id, content, visibility)
				: createStudentNote(stdNo, content, visibility),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['student-notes', stdNo],
			});
			if (!isEdit) {
				setContent('');
				setVisibility('role');
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
	});

	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append('file', file);
			return uploadNoteAttachment(stdNo, note!.id, formData);
		},
		onSuccess: invalidate,
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const deleteAttachmentMutation = useMutation({
		mutationFn: deleteNoteAttachment,
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
			}
			onClose();
		}
	}

	const isEmpty = !content.trim() || content === '<p></p>';

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={isEdit ? 'Edit Note' : 'Create Note'}
			size='lg'
			centered
		>
			<Stack gap='md'>
				<RichTextField
					toolbar='normal'
					placeholder='Write a note...'
					value={content}
					onChange={setContent}
					height={200}
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
						{visibility === 'role' &&
							'This note will only be visible to members of your department.'}
						{visibility === 'self' && 'This note will only be visible to you.'}
						{visibility === 'everyone' &&
							'This note will be visible to all staff.'}
					</Text>
				</Stack>
				{isEdit ? (
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
								onChange={(file) => file && uploadMutation.mutate(file)}
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
							{note.attachments.length === 0 && (
								<Text size='xs' c='dimmed'>
									No attachments yet
								</Text>
							)}
						</Group>
						{note.attachments.length > 0 && (
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
					</Stack>
				) : (
					<Text size='xs' c='dimmed'>
						Attachments can be added after saving the note.
					</Text>
				)}
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
