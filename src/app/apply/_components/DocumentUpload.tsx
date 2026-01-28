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
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconFile,
	IconFileTypePdf,
	IconFileUpload,
	IconId,
	IconPhoto,
	IconSchool,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
	analyzeAcademicDocument,
	analyzeDocument,
	analyzeIdentityDocument,
	type CertificateDocumentResult,
	type DocumentAnalysisResult,
	type IdentityDocumentResult,
} from '@/core/integrations/ai/documents';
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

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
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

export function DocumentUpload({
	type,
	onUploadComplete,
	onRemove,
	disabled,
	maxSize = MAX_FILE_SIZE,
	certificateTypes,
	applicantName,
}: Props) {
	const [file, setFile] = useState<FileWithPath | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [pendingResult, setPendingResult] = useState<DocumentUploadResult<
		typeof type
	> | null>(null);
	const [
		confirmModalOpened,
		{ open: openConfirmModal, close: closeConfirmModal },
	] = useDisclosure(false);

	const IdleIcon = ICON_MAP[type];

	async function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length === 0) return;

		const droppedFile = dropped[0];
		setFile(droppedFile);
		setUploadState('uploading');
		setErrorMessage(null);

		const arrayBuffer = await droppedFile.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const charArray = Array.from(uint8Array, (byte) =>
			String.fromCharCode(byte)
		);
		const binaryString = charArray.join('');
		const base64 = btoa(binaryString);

		setUploadState('reading');

		if (type === 'identity') {
			const result = await analyzeIdentityDocument(base64, droppedFile.type);
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
			const uploadResult: DocumentUploadResult<'identity'> = {
				file: droppedFile,
				base64,
				analysis: result.data,
			};
			setPendingResult(uploadResult as DocumentUploadResult<typeof type>);
			openConfirmModal();
		} else if (type === 'certificate') {
			const result = await analyzeAcademicDocument(
				base64,
				droppedFile.type,
				certificateTypes,
				applicantName
			);
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
			const uploadResult: DocumentUploadResult<'certificate'> = {
				file: droppedFile,
				base64,
				analysis: result.data,
			};
			setPendingResult(uploadResult as DocumentUploadResult<typeof type>);
			openConfirmModal();
		} else {
			const analysis = await analyzeDocument(base64, droppedFile.type);
			setUploadState('ready');
			(onUploadComplete as (r: DocumentUploadResult<'any'>) => void)({
				file: droppedFile,
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
							<IdleIcon
								size={52}
								stroke={1.5}
								color='var(--mantine-color-dimmed)'
							/>
						</Dropzone.Idle>

						<Stack gap='xs' ta='center'>
							<Text size='lg' inline>
								Drop file here or click to browse
							</Text>
							<Text size='sm' c='dimmed' inline>
								PDF or images • Max {formatFileSize(maxSize)}
							</Text>
						</Stack>
					</Group>
				</Dropzone>
			</Stack>
		</Paper>
	);
}
