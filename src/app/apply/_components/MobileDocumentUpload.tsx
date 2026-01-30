'use client';

import {
	Button,
	Grid,
	Paper,
	Progress,
	rem,
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
import { CameraModal } from '../../../shared/ui/CameraModal';
import { CertificateConfirmationModal } from './CertificateConfirmationModal';
import { IdentityConfirmationModal } from './IdentityConfirmationModal';

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
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isFromCamera, setIsFromCamera] = useState(false);
	const [pendingResult, setPendingResult] = useState<DocumentUploadResult<
		typeof type
	> | null>(null);
	const [cameraOpened, { open: openCamera, close: closeCamera }] =
		useDisclosure(false);
	const [
		confirmModalOpened,
		{ open: openConfirmModal, close: closeConfirmModal },
	] = useDisclosure(false);
	const galleryInputRef = useRef<HTMLInputElement>(null);

	const IdleIcon = ICON_MAP[type];

	async function processFile(selectedFile: File, fromCamera = false) {
		if (selectedFile.size > maxSize) {
			notifications.show({
				title: 'File too large',
				message: `Please upload a file under ${formatFileSize(maxSize)}`,
				color: 'red',
			});
			if (fromCamera) closeCamera();
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
			if (fromCamera) closeCamera();
			return;
		}

		setFile(selectedFile);
		setUploadState('uploading');
		setErrorMessage(null);
		setIsFromCamera(fromCamera);

		if (selectedFile.type.startsWith('image/')) {
			setPreviewUrl(URL.createObjectURL(selectedFile));
		} else {
			setPreviewUrl(null);
		}

		const arrayBuffer = await selectedFile.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const charArray = Array.from(uint8Array, (byte) =>
			String.fromCharCode(byte)
		);
		const binaryString = charArray.join('');
		const base64 = btoa(binaryString);

		setUploadState('reading');

		if (type === 'identity') {
			const result = await analyzeIdentityDocument(base64, selectedFile.type);
			if (!result.success) {
				setErrorMessage(result.error);
				setUploadState('error');
				closeCamera();
				notifications.show({
					title: 'Processing Failed',
					message: result.error,
					color: 'red',
				});
				return;
			}
			setUploadState('ready');
			closeCamera();
			const uploadResult: DocumentUploadResult<'identity'> = {
				file: selectedFile,
				base64,
				analysis: result.data,
			};
			setPendingResult(uploadResult as DocumentUploadResult<typeof type>);
			openConfirmModal();
		} else if (type === 'certificate') {
			const result = await analyzeAcademicDocument(
				base64,
				selectedFile.type,
				certificateTypes,
				applicantName
			);
			if (!result.success) {
				setErrorMessage(result.error);
				setUploadState('error');
				closeCamera();
				notifications.show({
					title: 'Processing Failed',
					message: result.error,
					color: 'red',
				});
				return;
			}
			setUploadState('ready');
			closeCamera();
			const uploadResult: DocumentUploadResult<'certificate'> = {
				file: selectedFile,
				base64,
				analysis: result.data,
			};
			setPendingResult(uploadResult as DocumentUploadResult<typeof type>);
			openConfirmModal();
		} else {
			const analysis = await analyzeDocument(base64, selectedFile.type);
			setUploadState('ready');
			closeCamera();
			(onUploadComplete as (r: DocumentUploadResult<'any'>) => void)({
				file: selectedFile,
				base64,
				analysis,
			});
		}
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
		}
		closeConfirmModal();
		setPendingResult(null);
	}

	function handleCancelConfirm() {
		closeConfirmModal();
		setPendingResult(null);
		handleRemove();
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
		event.target.value = '';
	}

	function handleCameraCapture(capturedFile: File) {
		processFile(capturedFile, true);
	}

	function handleGalleryClick() {
		galleryInputRef.current?.click();
	}

	function handleRemove() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setFile(null);
		setUploadState('idle');
		setErrorMessage(null);
		setPreviewUrl(null);
		setIsFromCamera(false);
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

	const identityAnalysis =
		type === 'identity' && pendingResult
			? (pendingResult as DocumentUploadResult<'identity'>).analysis
			: null;
	const certificateAnalysis =
		type === 'certificate' && pendingResult
			? (pendingResult as DocumentUploadResult<'certificate'>).analysis
			: null;

	if (file) {
		return (
			<>
				<CameraModal
					opened={cameraOpened || (isFromCamera && uploadState === 'reading')}
					onClose={closeCamera}
					onCapture={handleCameraCapture}
					isAnalyzing={isFromCamera && uploadState === 'reading'}
					capturedImageUrl={previewUrl}
				/>
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

				<Grid>
					<Grid.Col span={5}>
						<Button
							variant='default'
							fullWidth
							size='md'
							onClick={handleGalleryClick}
							disabled={disabled || isProcessing}
						>
							Phone
						</Button>
					</Grid.Col>
					<Grid.Col span={7}>
						<Button
							fullWidth
							variant='light'
							size='md'
							leftSection={<IconCamera size={'1rem'} />}
							onClick={openCamera}
							disabled={disabled || isProcessing}
							loading={isProcessing}
						>
							Camera
						</Button>
					</Grid.Col>
				</Grid>

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
