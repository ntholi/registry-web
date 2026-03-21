'use client';

import {
	Button,
	Grid,
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
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
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
	IconUpload,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { formatFileSize } from '@/shared/lib/utils/files';
import { CameraCapture } from '../../../shared/ui/CameraModal';
import { MAX_FILE_SIZE } from '../_lib/constants';
import type {
	DocumentUploadResult,
	DocumentUploadType,
	UploadState,
} from '../_lib/types';
import { CertificateConfirmationModal } from './CertificateConfirmationModal';
import { IdentityConfirmationModal } from './IdentityConfirmationModal';
import { ReceiptConfirmationModal } from './ReceiptConfirmationModal';

export type { DocumentUploadResult, DocumentUploadType, UploadState };

type Props<DT extends DocumentUploadType = DocumentUploadType> = {
	type: DT;
	onUploadComplete: (result: DocumentUploadResult<DT>) => void;
	onRemove?: () => void;
	disabled?: boolean;
	maxSize?: number;
	title?: string;
	description?: string;
	applicantName?: string;
	certificateTypes?: string[];
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const ACCEPTED_TYPES_STRING = 'image/*,application/pdf';

const ICON_MAP = {
	identity: IconId,
	certificate: IconSchool,
	receipt: IconFileUpload,
	any: IconFileUpload,
} as const;

function toBase64(file: File): Promise<string> {
	return file.arrayBuffer().then((buf) => {
		const bytes = new Uint8Array(buf);
		const chars = Array.from(bytes, (b) => String.fromCharCode(b));
		return btoa(chars.join(''));
	});
}

function getApiType(type: DocumentUploadType): string {
	return type === 'certificate' ? 'academic' : type;
}

export function DocumentUpload<DT extends DocumentUploadType>({
	type,
	onUploadComplete,
	onRemove,
	disabled,
	maxSize = MAX_FILE_SIZE,
	certificateTypes,
	applicantName,
	title,
	description,
}: Props<DT>) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [file, setFile] = useState<File | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [pendingResult, setPendingResult] = useState<DocumentUploadResult<
		typeof type
	> | null>(null);
	const [
		confirmModalOpened,
		{ open: openConfirmModal, close: closeConfirmModal },
	] = useDisclosure(false);
	const galleryInputRef = useRef<HTMLInputElement>(null);

	const IdleIcon = ICON_MAP[type] as React.ComponentType<{
		size?: number;
		stroke?: number;
		color?: string;
	}>;
	const isProcessing = uploadState === 'uploading' || uploadState === 'reading';

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

		const base64 = await toBase64(selectedFile);
		setUploadState('reading');

		const body: Record<string, unknown> = {
			type: getApiType(type),
			base64,
			mediaType: selectedFile.type,
		};
		if (type === 'certificate') {
			body.certificateTypes = certificateTypes;
			body.applicantName = applicantName;
		}

		const response = await fetch('/api/documents/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const result = await response.json();

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

		if (type === 'any') {
			(onUploadComplete as (r: DocumentUploadResult<'any'>) => void)({
				file: selectedFile,
				base64,
				analysis: result.data,
			});
			return;
		}

		const uploadResult = {
			file: selectedFile,
			base64,
			analysis: result.data,
		} as DocumentUploadResult<typeof type>;
		setPendingResult(uploadResult);
		openConfirmModal();
	}

	function handleConfirm() {
		if (!pendingResult) return;
		if (type === 'identity') {
			(onUploadComplete as (r: DocumentUploadResult<'identity'>) => void)(
				pendingResult as DocumentUploadResult<'identity'>
			);
		} else if (type === 'certificate') {
			(onUploadComplete as (r: DocumentUploadResult<'certificate'>) => void)(
				pendingResult as DocumentUploadResult<'certificate'>
			);
		} else if (type === 'receipt') {
			(onUploadComplete as (r: DocumentUploadResult<'receipt'>) => void)(
				pendingResult as DocumentUploadResult<'receipt'>
			);
		}
		closeConfirmModal();
		setPendingResult(null);
	}

	function handleCancelConfirm() {
		closeConfirmModal();
		setPendingResult(null);
		handleRemove();
	}

	function handleRemove() {
		setFile(null);
		setUploadState('idle');
		setErrorMessage(null);
		onRemove?.();
	}

	function handleDropzoneReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: `Please upload a PDF or image file under ${formatFileSize(maxSize)}`,
			color: 'red',
		});
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
		event.target.value = '';
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

	const identityAnalysis =
		type === 'identity' && pendingResult
			? (pendingResult as DocumentUploadResult<'identity'>).analysis
			: null;
	const certificateAnalysis =
		type === 'certificate' && pendingResult
			? (pendingResult as DocumentUploadResult<'certificate'>).analysis
			: null;
	const receiptAnalysis =
		type === 'receipt' && pendingResult
			? (pendingResult as DocumentUploadResult<'receipt'>).analysis
			: null;

	if (file) {
		return (
			<>
				<IdentityConfirmationModal
					opened={confirmModalOpened && type === 'identity'}
					onClose={handleCancelConfirm}
					onConfirm={handleConfirm}
					analysis={identityAnalysis}
				/>
				<CertificateConfirmationModal
					opened={confirmModalOpened && type === 'certificate'}
					onClose={handleCancelConfirm}
					onConfirm={handleConfirm}
					analysis={certificateAnalysis}
				/>
				<ReceiptConfirmationModal
					opened={confirmModalOpened && type === 'receipt'}
					onClose={handleCancelConfirm}
					onConfirm={handleConfirm}
					analysis={receiptAnalysis}
				/>
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
			</>
		);
	}

	if (isMobile) {
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
							<IdleIcon size={32} stroke={1.5} />
						</ThemeIcon>
						<Text size='md' fw={500}>
							{title ?? 'Upload Document'}
						</Text>
						<Text size='sm' c='dimmed'>
							{description ?? `PDF or images • Max ${formatFileSize(maxSize)}`}
						</Text>
					</Stack>

					<Grid>
						<Grid.Col span={5}>
							<Button
								variant='default'
								fullWidth
								size='md'
								onClick={() => galleryInputRef.current?.click()}
								disabled={disabled || isProcessing}
							>
								Phone
							</Button>
						</Grid.Col>
						<Grid.Col span={7}>
							<CameraCapture
								onCapture={(f) => processFile(f)}
								disabled={disabled}
							>
								{({ openCamera, isProcessing: cameraProcessing }) => (
									<Button
										fullWidth
										variant='light'
										size='md'
										leftSection={<IconCamera size={'1rem'} />}
										onClick={openCamera}
										disabled={disabled || isProcessing || cameraProcessing}
										loading={cameraProcessing}
									>
										Camera
									</Button>
								)}
							</CameraCapture>
						</Grid.Col>
					</Grid>

					<input
						ref={galleryInputRef}
						type='file'
						accept={ACCEPTED_TYPES_STRING}
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
					onDrop={(files) =>
						files.length > 0 && processFile(files[0] as FileWithPath)
					}
					onReject={handleDropzoneReject}
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
							<IdleIcon
								size={52}
								stroke={1.5}
								color='var(--mantine-color-dimmed)'
							/>
						</Dropzone.Idle>

						<Stack gap='xs' ta='center'>
							<Text size='lg' inline>
								{title ?? 'Drop file here or click to browse'}
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
