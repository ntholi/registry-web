'use client';

import {
	ActionIcon,
	Anchor,
	Group,
	Image,
	Paper,
	rem,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconFile,
	IconFileTypeDoc,
	IconFileTypePdf,
	IconFileTypePpt,
	IconFileTypeXls,
	IconPhoto,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { formatFileSize } from '@/shared/lib/utils/files';
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
import { deleteNoteAttachment, uploadNoteAttachment } from '../_server/actions';
import type { StudentNoteAttachmentRecord } from '../_server/repository';

type Props = {
	noteId: string;
	stdNo: number;
	attachments: StudentNoteAttachmentRecord[];
	canEdit: boolean;
};

function getFileIcon(mimeType: string | null) {
	if (!mimeType) return IconFile;
	if (mimeType === 'application/pdf') return IconFileTypePdf;
	if (mimeType.startsWith('image/')) return IconPhoto;
	if (mimeType.includes('word') || mimeType.includes('document'))
		return IconFileTypeDoc;
	if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
		return IconFileTypePpt;
	if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
		return IconFileTypeXls;
	return IconFile;
}

function isImage(mimeType: string | null) {
	return mimeType?.startsWith('image/') ?? false;
}

export default function AttachmentList({
	noteId,
	stdNo,
	attachments,
	canEdit,
}: Props) {
	const queryClient = useQueryClient();

	const uploadMutation = useActionMutation(
		(file: File) => {
			const formData = new FormData();
			formData.append('file', file);
			return uploadNoteAttachment(stdNo, noteId, formData);
		},
		{
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: ['student-notes', stdNo],
				});
				notifications.show({
					title: 'Success',
					message: 'Attachment uploaded',
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

	const deleteMutation = useActionMutation(
		(id: string) => deleteNoteAttachment(id),
		{
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: ['student-notes', stdNo],
				});
				notifications.show({
					title: 'Success',
					message: 'Attachment deleted',
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

	function handleDeleteAttachment(id: string) {
		modals.openConfirmModal({
			centered: true,
			title: 'Delete Attachment',
			children: (
				<Text size='sm'>Are you sure you want to delete this attachment?</Text>
			),
			confirmProps: { color: 'red' },
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			onConfirm: () => deleteMutation.mutate(id),
		});
	}

	return (
		<Stack gap='xs'>
			{canEdit && (
				<Dropzone
					onDrop={(files) => {
						for (const file of files) {
							uploadMutation.mutate(file);
						}
					}}
					onReject={(rejections) => {
						for (const rejection of rejections) {
							notifications.show({
								title: 'Rejected',
								message: `${rejection.file.name}: ${rejection.errors.map((e) => e.message).join(', ')}`,
								color: 'red',
							});
						}
					}}
					maxSize={MAX_ATTACHMENT_SIZE}
					accept={ALLOWED_MIME_TYPES}
					loading={uploadMutation.isPending}
				>
					<Group
						justify='center'
						gap='xl'
						mih={60}
						style={{ pointerEvents: 'none' }}
					>
						<Dropzone.Accept>
							<IconUpload
								style={{
									width: rem(32),
									height: rem(32),
									color: 'var(--mantine-color-blue-6)',
								}}
								stroke={1.5}
							/>
						</Dropzone.Accept>
						<Dropzone.Reject>
							<IconX
								style={{
									width: rem(32),
									height: rem(32),
									color: 'var(--mantine-color-red-6)',
								}}
								stroke={1.5}
							/>
						</Dropzone.Reject>
						<Dropzone.Idle>
							<IconUpload
								style={{
									width: rem(32),
									height: rem(32),
									color: 'var(--mantine-color-dimmed)',
								}}
								stroke={1.5}
							/>
						</Dropzone.Idle>
						<Text size='sm' c='dimmed'>
							Drop files here or click to upload (max 5 MB)
						</Text>
					</Group>
				</Dropzone>
			)}

			{attachments.length > 0 && (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{attachments.map((att) => {
						const FileIcon = getFileIcon(att.mimeType);
						const url = getPublicUrl(att.fileKey);
						return (
							<Paper key={att.id} p='xs' withBorder>
								<Stack gap={4}>
									{isImage(att.mimeType) && (
										<Image
											src={url}
											alt={att.fileName}
											h={80}
											fit='contain'
											radius='sm'
										/>
									)}
									<Group gap='xs' wrap='nowrap'>
										<FileIcon size={20} />
										<Anchor
											href={url}
											target='_blank'
											size='xs'
											lineClamp={1}
											style={{ flex: 1 }}
										>
											{att.fileName}
										</Anchor>
										{canEdit && (
											<ActionIcon
												variant='subtle'
												size='xs'
												color='red'
												onClick={() => handleDeleteAttachment(att.id)}
												loading={deleteMutation.isPending}
											>
												<IconTrash size={12} />
											</ActionIcon>
										)}
									</Group>
									{att.fileSize != null && (
										<Text size='xs' c='dimmed'>
											{formatFileSize(att.fileSize)}
										</Text>
									)}
								</Stack>
							</Paper>
						);
					})}
				</SimpleGrid>
			)}
		</Stack>
	);
}
