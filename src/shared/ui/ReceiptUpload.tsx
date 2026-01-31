'use client';

import {
	Button,
	Group,
	Paper,
	Progress,
	rem,
	SimpleGrid,
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
	IconCamera,
	IconFile,
	IconFileTypePdf,
	IconPhoto,
	IconReceipt,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import {
	analyzeReceipt,
	type ReceiptResult,
} from '@/core/integrations/ai/documents';
import { CameraCapture } from './CameraModal';

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
	variant?: 'dropzone' | 'mobile';
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const ACCEPTED_FILE_TYPES = 'image/*,application/pdf';
const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
	variant = 'dropzone',
}: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const galleryInputRef = useRef<HTMLInputElement>(null);

	async function processFile(selectedFile: File) {
		if (selectedFile.size > maxSize) {
			notifications.show({
				title: 'File too large',
				message: `Please upload a file under ${formatFileSize(maxSize)}`,
				color: 'red',
			});
			return;
		}

		const isValidType =
			selectedFile.type.startsWith('image/') ||
			selectedFile.type === 'application/pdf';
		if (!isValidType) {
			notifications.show({
				title: 'Invalid file type',
				message: 'Please upload a PDF or image file',
				color: 'red',
			});
			return;
		}

		setFile(selectedFile);
		setUploadState('uploading');
		setErrorMessage(null);

		const arrayBuffer = await selectedFile.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const charArray = Array.from(uint8Array, (byte) =>
			String.fromCharCode(byte)
		);
		const binaryString = charArray.join('');
		const base64 = btoa(binaryString);

		setUploadState('reading');

		const result = await analyzeReceipt(base64, selectedFile.type);
		if (!result.success) {
			setErrorMessage(result.error);
			setUploadState('error');
			notifications.show({
				title: 'Processing Failed',
				message: result.error,
				color: 'red',
			});
			return;
		}
		setUploadState('ready');
		onUploadComplete({
			file: selectedFile,
			base64,
			analysis: result.data,
		});
	}

	async function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length === 0) return;
		await processFile(dropped[0]);
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: `Please upload a PDF or image file under ${formatFileSize(
				maxSize
			)}`,
			color: 'red',
		});
	}

	function handleRemove() {
		setFile(null);
		setUploadState('idle');
		setErrorMessage(null);
		onRemove?.();
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
		event.target.value = '';
	}

	async function handleCameraCapture(capturedFile: File) {
		await processFile(capturedFile);
	}

	function handleGalleryClick() {
		galleryInputRef.current?.click();
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

	if (variant === 'mobile') {
		return (
			<Paper withBorder radius='md' p='md'>
				<Stack gap='md'>
					<Stack gap={4} ta='center'>
						<ThemeIcon
							variant='light'
							size={60}
							radius='md'
							color='var(--mantine-color-dimmed)'
							mx='auto'
						>
							<IconReceipt size={32} stroke={1.5} />
						</ThemeIcon>
						<Text size='md' fw={500}>
							{title ?? 'Upload Receipt'}
						</Text>
						<Text size='sm' c='dimmed'>
							{description ?? `PDF or images • Max ${formatFileSize(maxSize)}`}
						</Text>
					</Stack>

					<SimpleGrid cols={2} spacing='sm'>
						<CameraCapture onCapture={handleCameraCapture} disabled={disabled}>
							{({ openCamera, isProcessing: cameraProcessing }) => (
								<Button
									variant='light'
									size='lg'
									leftSection={<IconCamera size={20} />}
									onClick={openCamera}
									disabled={disabled || isProcessing || cameraProcessing}
									loading={cameraProcessing}
								>
									Camera
								</Button>
							)}
						</CameraCapture>
						<Button
							variant='light'
							size='lg'
							leftSection={<IconPhoto size={20} />}
							onClick={handleGalleryClick}
							disabled={disabled || isProcessing}
						>
							Gallery
						</Button>
					</SimpleGrid>

					<input
						ref={galleryInputRef}
						type='file'
						accept={ACCEPTED_FILE_TYPES}
						onChange={handleFileChange}
						style={{ display: 'none' }}
					/>
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
