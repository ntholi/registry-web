'use client';

import {
	Button,
	Paper,
	Progress,
	rem,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconCamera,
	IconFile,
	IconFileTypePdf,
	IconFileUpload,
	IconId,
	IconPhoto,
	IconSchool,
	IconTrash,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import {
	analyzeAcademicDocument,
	analyzeDocument,
	analyzeIdentityDocument,
	type CertificateDocumentResult,
	type DocumentAnalysisResult,
	type IdentityDocumentResult,
} from '@/core/integrations/ai/documents';
import { CameraModal } from './CameraModal';

export type DocumentUploadType = 'identity' | 'certificate' | 'any';

export type UploadState = 'idle' | 'uploading' | 'reading' | 'ready' | 'error';

type AnalysisResultMap = {
	identity: IdentityDocumentResult;
	certificate: CertificateDocumentResult;
	any: DocumentAnalysisResult;
};

export type DocumentUploadResult<T extends DocumentUploadType> = {
	file: File;
	base64: string;
	analysis: AnalysisResultMap[T];
};

type BaseProps = {
	onRemove?: () => void;
	disabled?: boolean;
	maxSize?: number;
	title?: string;
	description?: string;
};

type IdentityProps = BaseProps & {
	type: 'identity';
	onUploadComplete: (result: DocumentUploadResult<'identity'>) => void;
	certificateTypes?: never;
	applicantName?: never;
};

type CertificateProps = BaseProps & {
	type: 'certificate';
	onUploadComplete: (result: DocumentUploadResult<'certificate'>) => void;
	certificateTypes?: string[];
	applicantName?: string;
};

type AnyProps = BaseProps & {
	type: 'any';
	onUploadComplete: (result: DocumentUploadResult<'any'>) => void;
	certificateTypes?: string[];
	applicantName?: string;
};

type Props = IdentityProps | CertificateProps | AnyProps;

const ACCEPTED_TYPES = 'image/*,application/pdf';
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

const ICON_MAP = {
	identity: IconId,
	certificate: IconSchool,
	any: IconFileUpload,
} as const;

export function MobileDocumentUpload({
	type,
	onUploadComplete,
	onRemove,
	disabled,
	maxSize = MAX_FILE_SIZE,
	certificateTypes,
	title,
	description,
	applicantName,
}: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [cameraOpened, { open: openCamera, close: closeCamera }] =
		useDisclosure(false);
	const galleryInputRef = useRef<HTMLInputElement>(null);

	const IdleIcon = ICON_MAP[type];

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

		try {
			const arrayBuffer = await selectedFile.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const charArray = Array.from(uint8Array, (byte) =>
				String.fromCharCode(byte)
			);
			const binaryString = charArray.join('');
			const base64 = btoa(binaryString);

			setUploadState('reading');

			if (type === 'identity') {
				const analysis = await analyzeIdentityDocument(
					base64,
					selectedFile.type
				);
				setUploadState('ready');
				(onUploadComplete as (r: DocumentUploadResult<'identity'>) => void)({
					file: selectedFile,
					base64,
					analysis,
				});
			} else if (type === 'certificate') {
				const analysis = await analyzeAcademicDocument(
					base64,
					selectedFile.type,
					certificateTypes,
					applicantName
				);
				setUploadState('ready');
				(onUploadComplete as (r: DocumentUploadResult<'certificate'>) => void)({
					file: selectedFile,
					base64,
					analysis,
				});
			} else {
				const analysis = await analyzeDocument(base64, selectedFile.type);
				setUploadState('ready');
				(onUploadComplete as (r: DocumentUploadResult<'any'>) => void)({
					file: selectedFile,
					base64,
					analysis,
				});
			}
		} catch (error) {
			console.error('Document processing error:', error);
			const message =
				error instanceof Error ? error.message : 'Failed to process document';
			setErrorMessage(message);
			setUploadState('error');
			notifications.show({
				title: 'Processing Failed',
				message,
				color: 'red',
			});
		}
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
		event.target.value = '';
	}

	function handleCameraCapture(capturedFile: File) {
		processFile(capturedFile);
	}

	function handleGalleryClick() {
		galleryInputRef.current?.click();
	}

	function handleRemove() {
		setFile(null);
		setUploadState('idle');
		setErrorMessage(null);
		onRemove?.();
	}

	function getFileIcon() {
		if (!file) return <IdleIcon size={52} stroke={1.5} />;
		if (file.type === 'application/pdf')
			return <IconFileTypePdf size={40} stroke={1.5} />;
		if (file.type.startsWith('image/'))
			return <IconPhoto size={40} stroke={1.5} />;
		return <IconFile size={40} stroke={1.5} />;
	}

	function getStatusMessage(): string {
		switch (uploadState) {
			case 'uploading':
				return 'Uploading document...';
			case 'reading':
				return 'Reading document...';
			case 'ready':
				return 'Document processed successfully';
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

					{!isProcessing && uploadState === 'error' && (
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
		<Paper withBorder radius='md' p='md'>
			<CameraModal
				opened={cameraOpened}
				onClose={closeCamera}
				onCapture={handleCameraCapture}
			/>
			<Stack gap='md'>
				<Stack gap={4} ta='center'>
					<ThemeIcon
						variant='light'
						size={60}
						radius='md'
						color='var(--mantine-color-dimmed)'
						mx='auto'
					>
						<IdleIcon size={32} stroke={1.5} />
					</ThemeIcon>
					<Text size='md' fw={500}>
						{title ?? 'Upload Document'}
					</Text>
					<Text size='sm' c='dimmed'>
						{description ?? `PDF or images • Max ${formatFileSize(maxSize)}`}
					</Text>
				</Stack>

				<SimpleGrid cols={2} spacing='sm'>
					<Button
						variant='light'
						leftSection={<IconCamera size={'1rem'} />}
						onClick={openCamera}
						disabled={disabled || isProcessing}
						loading={isProcessing}
					>
						Camera
					</Button>
					<Button
						variant='light'
						leftSection={<IconPhoto size={'1rem'} />}
						onClick={handleGalleryClick}
						disabled={disabled || isProcessing}
					>
						Gallery
					</Button>
				</SimpleGrid>

				<input
					ref={galleryInputRef}
					type='file'
					accept={ACCEPTED_TYPES}
					onChange={handleFileChange}
					style={{ display: 'none' }}
				/>
			</Stack>
		</Paper>
	);
}
