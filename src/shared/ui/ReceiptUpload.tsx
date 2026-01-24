'use client';

import {
	Button,
	Group,
	Paper,
	Progress,
	rem,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
	IconFile,
	IconFileTypePdf,
	IconPhoto,
	IconReceipt,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
	analyzeReceipt,
	type ReceiptResult,
} from '@/core/integrations/ai/documents';

export type UploadState = 'idle' | 'uploading' | 'reading' | 'ready' | 'error';

export type ReceiptUploadResult = {
	file: File;
	base64: string;
	analysis: ReceiptResult;
};

type Props = {
	onUploadComplete: (result: ReceiptUploadResult) => void;
	onRemove?: () => void;
	disabled?: boolean;
	maxSize?: number;
	title?: string;
	description?: string;
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const exp = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	);
	const val = bytes / 1024 ** exp;
	return `${val.toFixed(val < 10 && exp > 0 ? 1 : 0)} ${units[exp]}`;
}

export function ReceiptUpload({
	onUploadComplete,
	onRemove,
	disabled,
	maxSize = MAX_FILE_SIZE,
	title,
	description,
}: Props) {
	const [file, setFile] = useState<FileWithPath | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	async function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length === 0) return;

		const droppedFile = dropped[0];
		setFile(droppedFile);
		setUploadState('uploading');
		setErrorMessage(null);

		try {
			const arrayBuffer = await droppedFile.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const charArray = Array.from(uint8Array, (byte) =>
				String.fromCharCode(byte)
			);
			const binaryString = charArray.join('');
			const base64 = btoa(binaryString);

			setUploadState('reading');

			const analysis = await analyzeReceipt(base64, droppedFile.type);
			setUploadState('ready');
			onUploadComplete({
				file: droppedFile,
				base64,
				analysis,
			});
		} catch (error) {
			console.error('Receipt processing error:', error);
			const message =
				error instanceof Error ? error.message : 'Failed to process receipt';
			setErrorMessage(message);
			setUploadState('error');
			notifications.show({
				title: 'Processing Failed',
				message,
				color: 'red',
			});
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: `Please upload a PDF or image file under ${formatFileSize(maxSize)}`,
			color: 'red',
		});
	}

	function handleRemove() {
		setFile(null);
		setUploadState('idle');
		setErrorMessage(null);
		onRemove?.();
	}

	function getFileIcon() {
		if (!file) return <IconReceipt size={52} stroke={1.5} />;
		if (file.type === 'application/pdf')
			return <IconFileTypePdf size={40} stroke={1.5} />;
		if (file.type.startsWith('image/'))
			return <IconPhoto size={40} stroke={1.5} />;
		return <IconFile size={40} stroke={1.5} />;
	}

	function getStatusMessage(): string {
		switch (uploadState) {
			case 'uploading':
				return 'Uploading receipt...';
			case 'reading':
				return 'Reading receipt...';
			case 'ready':
				return 'Receipt processed successfully';
			case 'error':
				return errorMessage ?? 'An error occurred';
			default:
				return '';
		}
	}

	function getStatusColor(): string {
		switch (uploadState) {
			case 'ready':
				return 'green';
			case 'error':
				return 'red';
			default:
				return 'blue';
		}
	}

	const isProcessing = uploadState === 'uploading' || uploadState === 'reading';

	if (file) {
		return (
			<Paper withBorder radius='md' p='xl'>
				<Stack gap='md' align='center' mih={rem(180)} justify='center'>
					<ThemeIcon
						variant='light'
						size={80}
						radius='md'
						color={getStatusColor()}
					>
						{getFileIcon()}
					</ThemeIcon>

					<Stack gap={4} align='center'>
						<Text size='sm' fw={600} ta='center' maw={300} truncate='end'>
							{file.name}
						</Text>
						<Text size='sm' c='dimmed'>
							{formatFileSize(file.size)}
						</Text>
					</Stack>

					{isProcessing && (
						<Stack gap='xs' w='100%'>
							<Progress radius='xs' value={100} animated />
							<Text size='xs' c='dimmed' ta='center'>
								{getStatusMessage()}
							</Text>
						</Stack>
					)}

					{(uploadState === 'ready' || uploadState === 'error') && (
						<Text size='xs' c={getStatusColor()} ta='center'>
							{getStatusMessage()}
						</Text>
					)}

					{!isProcessing && (
						<Button
							variant='light'
							color='red'
							size='sm'
							leftSection={<IconTrash size={16} />}
							onClick={handleRemove}
							mt='xs'
						>
							Remove File
						</Button>
					)}
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper withBorder p='sm'>
			<Stack gap='sm'>
				<Dropzone
					onDrop={handleDrop}
					onReject={handleReject}
					maxFiles={1}
					maxSize={maxSize}
					accept={ACCEPTED_MIME_TYPES}
					disabled={disabled || isProcessing}
					loading={isProcessing}
				>
					<Group
						justify='center'
						gap='xl'
						mih={rem(140)}
						style={{ pointerEvents: 'none' }}
					>
						<Dropzone.Accept>
							<IconUpload
								size={52}
								stroke={1.5}
								color='var(--mantine-color-blue-6)'
							/>
						</Dropzone.Accept>
						<Dropzone.Reject>
							<IconFile
								size={52}
								stroke={1.5}
								color='var(--mantine-color-red-6)'
							/>
						</Dropzone.Reject>
						<Dropzone.Idle>
							<IconReceipt
								size={52}
								stroke={1.5}
								color='var(--mantine-color-dimmed)'
							/>
						</Dropzone.Idle>

						<Stack gap='xs' ta='center'>
							<Text size='lg' inline>
								{title ?? 'Drop receipt here or click to browse'}
							</Text>
							<Text size='sm' c='dimmed' inline>
								{description ??
									`PDF or images • Max ${formatFileSize(maxSize)}`}
							</Text>
						</Stack>
					</Group>
				</Dropzone>
			</Stack>
		</Paper>
	);
}
