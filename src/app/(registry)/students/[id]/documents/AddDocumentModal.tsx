'use client';

import {
	Button,
	Group,
	Modal,
	Paper,
	rem,
	Select,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
	IconFile,
	IconFileUpload,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { uploadDocument } from '@/lib/storage';
import { createDocument } from '@/server/documents/actions';
import documentTypes from './documentTypes';

type AddDocumentModalProps = {
	opened: boolean;
	onClose: () => void;
	stdNo: number;
	onSuccess: () => void;
};

function formatFileSize(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	);
	const value = bytes / 1024 ** exponent;
	return `${value.toFixed(value < 10 && exponent > 0 ? 1 : 0)} ${units[exponent]}`;
}

export default function AddDocumentModal({
	opened,
	onClose,
	stdNo,
	onSuccess,
}: AddDocumentModalProps) {
	const [files, setFiles] = useState<FileWithPath[]>([]);
	const [type, setType] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const maxFileSize = 10 * 1024 * 1024;

	function handleDrop(dropped: FileWithPath[]): void {
		if (dropped.length > 0) {
			setFiles([dropped[0]]);
		}
	}

	function handleReject(fileRejections: FileRejection[]): void {
		if (fileRejections.length > 0) {
			notifications.show({
				title: 'File not accepted',
				message: 'Please upload a supported file under 10 MB.',
				color: 'red',
			});
		}
	}

	function handleRemoveFile(): void {
		setFiles([]);
	}

	function handleTypeChange(selected: string | null): void {
		setType(selected);
	}

	async function handleSubmit(): Promise<void> {
		if (files.length === 0) {
			notifications.show({
				title: 'Error',
				message: 'Please select a file to upload',
				color: 'red',
			});
			return;
		}

		try {
			setLoading(true);

			const file = files[0];
			const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
			const generatedFileName = `${nanoid()}.${ext}`;

			const uploadedPath = await uploadDocument(
				file,
				generatedFileName,
				'documents'
			);

			await createDocument({
				fileName: uploadedPath,
				type: type || undefined,
				stdNo,
			});

			notifications.show({
				title: 'Success',
				message: 'Document uploaded successfully',
				color: 'green',
			});

			setFiles([]);
			setType(null);
			onSuccess();
		} catch (error) {
			console.error('Error uploading document:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to upload document',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	function handleClose(): void {
		if (!loading) {
			setFiles([]);
			setType(null);
			onClose();
		}
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Upload Document'
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
		>
			<Stack gap='lg'>
				<Select
					label='Document Type'
					placeholder='Select document type'
					searchable
					value={type}
					onChange={handleTypeChange}
					data={documentTypes}
					clearable
					disabled={loading}
				/>

				{files.length === 0 ? (
					<Paper withBorder radius='md' p='lg'>
						<Dropzone
							onDrop={handleDrop}
							onReject={handleReject}
							maxFiles={1}
							maxSize={maxFileSize}
							accept={[
								MIME_TYPES.pdf,
								MIME_TYPES.png,
								MIME_TYPES.jpeg,
								MIME_TYPES.svg,
								MIME_TYPES.gif,
								MIME_TYPES.webp,
								'application/msword',
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							]}
							style={{ cursor: 'pointer' }}
							disabled={loading}
							loading={loading}
						>
							<Group
								justify='center'
								gap='xl'
								mih={220}
								style={{ pointerEvents: 'none' }}
							>
								<Dropzone.Accept>
									<IconUpload stroke={1.5} size={20} />
								</Dropzone.Accept>
								<Dropzone.Reject>
									<IconX
										style={{
											width: rem(52),
											height: rem(52),
											color: 'var(--mantine-color-red-6)',
										}}
										stroke={1.5}
									/>
								</Dropzone.Reject>
								<Dropzone.Idle>
									<IconFileUpload size='6rem' />
								</Dropzone.Idle>

								<Stack gap={4} align='center'>
									<Text size='xl' inline>
										Upload file
									</Text>
									<Text size='sm' c='dimmed' inline mt={7}>
										Attach one file at a time (PDF, Images, Word documents)
									</Text>
									<Text size='xs' c='dimmed' mt={4}>
										Maximum file size: 10 MB
									</Text>
								</Stack>
							</Group>
						</Dropzone>
					</Paper>
				) : (
					<Paper withBorder radius='md' p='xl'>
						<Stack
							gap='md'
							align='center'
							style={{ minHeight: rem(220) }}
							justify='center'
						>
							<ThemeIcon variant='default' size={80} radius='md'>
								<IconFile size={40} stroke={1.5} />
							</ThemeIcon>

							<Stack gap={4} align='center'>
								<Text size='sm' fw={600} ta='center' maw={300} truncate='end'>
									{files[0].name}
								</Text>
								<Text size='sm' c='dimmed'>
									{formatFileSize(files[0].size)}
								</Text>
							</Stack>

							<Button
								variant='light'
								color='red'
								size='sm'
								leftSection={<IconTrash size={16} />}
								onClick={handleRemoveFile}
								disabled={loading}
								mt='xs'
							>
								Remove File
							</Button>
						</Stack>
					</Paper>
				)}

				<Group justify='flex-end' mt='md'>
					<Button variant='subtle' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						leftSection={<IconUpload size={16} />}
						onClick={handleSubmit}
						loading={loading}
						disabled={files.length === 0}
					>
						Upload
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
