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
import { useMutation } from '@tanstack/react-query';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatFileSize } from '@/shared/lib/utils/files';

export interface AttachmentItem {
	id: string;
	fileName: string;
	fileKey?: string | null;
	fileUrl?: string | null;
	fileSize: number | null;
	mimeType: string | null;
}

type Props = {
	attachments: AttachmentItem[];
	canEdit: boolean;
	accept: string[];
	maxSize: number;
	onUpload: (file: File) => Promise<unknown>;
	onDelete: (id: string) => Promise<unknown>;
	onChange?: () => Promise<void> | void;
	uploadSuccessMessage?: string;
	deleteSuccessMessage?: string;
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

export default function AttachmentManager({
	attachments,
	canEdit,
	accept,
	maxSize,
	onUpload,
	onDelete,
	onChange,
	uploadSuccessMessage = 'Attachment uploaded',
	deleteSuccessMessage = 'Attachment deleted',
}: Props) {
	const uploadMutation = useMutation({
		mutationFn: onUpload,
		onSuccess: async () => {
			await onChange?.();
			notifications.show({
				title: 'Success',
				message: uploadSuccessMessage,
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

	const deleteMutation = useMutation({
		mutationFn: onDelete,
		onSuccess: async () => {
			await onChange?.();
			notifications.show({
				title: 'Success',
				message: deleteSuccessMessage,
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
								message: `${rejection.file.name}: ${rejection.errors.map((error) => error.message).join(', ')}`,
								color: 'red',
							});
						}
					}}
					maxSize={maxSize}
					accept={accept}
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
					{attachments.map((attachment) => {
						const FileIcon = getFileIcon(attachment.mimeType);
						const url = attachment.fileUrl ?? getPublicUrl(attachment.fileKey ?? '');

						return (
							<Paper key={attachment.id} p='xs' withBorder>
								<Stack gap={4}>
									{isImage(attachment.mimeType) && url && (
										<Image
											src={url}
											alt={attachment.fileName}
											h={80}
											fit='contain'
											radius='sm'
										/>
									)}
									<Group gap='xs' wrap='nowrap'>
										<FileIcon size={20} />
										{url ? (
											<Anchor
												href={url}
												target='_blank'
												size='xs'
												lineClamp={1}
												style={{ flex: 1 }}
											>
												{attachment.fileName}
											</Anchor>
										) : (
											<Text size='xs' lineClamp={1} style={{ flex: 1 }}>
												{attachment.fileName}
											</Text>
										)}
										{canEdit && (
											<ActionIcon
												variant='subtle'
												size='xs'
												color='red'
												onClick={() => handleDeleteAttachment(attachment.id)}
												loading={deleteMutation.isPending}
											>
												<IconTrash size={12} />
											</ActionIcon>
										)}
									</Group>
									{attachment.fileSize != null && (
										<Text size='xs' c='dimmed'>
											{formatFileSize(attachment.fileSize)}
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
