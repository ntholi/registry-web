'use client';

import {
	Button,
	Group,
	Modal,
	Paper,
	Progress,
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
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { documentTypeEnum } from '@registry/_database';
import {
	IconFile,
	IconFileTypePdf,
	IconFileUpload,
	IconPhoto,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import {
	analyzeDocumentWithAI,
	createAcademicRecordFromDocument,
	getDocumentFolder,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '../_server/actions';

type DocumentType = (typeof documentTypeEnum.enumValues)[number];

const TYPE_OPTIONS = documentTypeEnum.enumValues.map((t) => ({
	value: t,
	label: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

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

function getFileExtension(name: string) {
	const index = name.lastIndexOf('.');
	if (index === -1 || index === name.length - 1) return '';
	return name.slice(index);
}

function mapDocumentTypeFromAI(
	result: DocumentAnalysisResult
): DocumentType | null {
	if (result.category === 'identity') {
		return result.documentType === 'identity'
			? 'identity'
			: result.documentType === 'passport_photo'
				? 'passport_photo'
				: null;
	}
	if (result.category === 'academic') {
		switch (result.documentType) {
			case 'certificate':
				return 'certificate';
			case 'transcript':
				return 'transcript';
			case 'academic_record':
				return 'academic_record';
			case 'recommendation_letter':
				return 'recommendation_letter';
			default:
				return 'certificate';
		}
	}
	if (result.category === 'other') {
		switch (result.documentType) {
			case 'proof_of_payment':
				return 'proof_of_payment';
			case 'personal_statement':
				return 'personal_statement';
			case 'medical_report':
				return 'medical_report';
			case 'enrollment_letter':
				return 'enrollment_letter';
			case 'clearance_form':
				return 'clearance_form';
			default:
				return 'other';
		}
	}
	return null;
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'ready';

type UploadModalProps = {
	opened: boolean;
	onClose: () => void;
	applicantId: string;
};

export function UploadModal({
	opened,
	onClose,
	applicantId,
}: UploadModalProps) {
	const router = useRouter();
	const [files, setFiles] = useState<FileWithPath[]>([]);
	const [type, setType] = useState<DocumentType | null>(null);
	const [uploadState, setUploadState] = useState<UploadState>('idle');
	const [analysisResult, setAnalysisResult] =
		useState<DocumentAnalysisResult | null>(null);
	const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length === 0) return;

		const file = dropped[0];
		setFiles([file]);
		setUploadState('uploading');
		setAnalysisResult(null);
		setType(null);

		try {
			const folder = await getDocumentFolder(applicantId);
			const fileName = `${nanoid()}.${getFileExtension(file.name)}`;
			await uploadDocument(file, fileName, folder);
			setUploadedFileName(fileName);

			setUploadState('analyzing');

			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const charArray = Array.from(uint8Array, (byte) =>
				String.fromCharCode(byte)
			);
			const binaryString = charArray.join('');
			const base64Data = btoa(binaryString);

			const result = await analyzeDocumentWithAI(base64Data, file.type);
			setAnalysisResult(result);

			const detectedType = mapDocumentTypeFromAI(result);
			if (detectedType) {
				setType(detectedType);
			}

			setUploadState('ready');
		} catch (error) {
			console.error('Upload/Analysis error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to process document',
				color: 'red',
			});
			setUploadState('idle');
			setFiles([]);
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: 'Please upload a supported file under 10 MB.',
			color: 'red',
		});
	}

	function handleRemoveFile() {
		setFiles([]);
		setType(null);
		setUploadState('idle');
		setAnalysisResult(null);
		setUploadedFileName(null);
	}

	function handleTypeChange(value: string | null) {
		setType(value as DocumentType | null);
	}

	async function handleSubmit() {
		if (!type) {
			notifications.show({
				title: 'Error',
				message: 'Please select a document type',
				color: 'red',
			});
			return;
		}

		if (!uploadedFileName) {
			notifications.show({
				title: 'Error',
				message: 'No file uploaded',
				color: 'red',
			});
			return;
		}

		try {
			setSaving(true);

			await saveApplicantDocument({
				applicantId,
				fileName: uploadedFileName,
				type,
			});

			if (analysisResult) {
				if (analysisResult.category === 'identity' && type === 'identity') {
					try {
						await updateApplicantFromIdentity(applicantId, {
							fullName: analysisResult.fullName,
							dateOfBirth: analysisResult.dateOfBirth,
							nationalId: analysisResult.nationalId,
							nationality: analysisResult.nationality,
							gender: analysisResult.gender,
							birthPlace: analysisResult.birthPlace,
							address: analysisResult.address,
						});
						notifications.show({
							title: 'Personal Info Updated',
							message:
								'Applicant information has been updated from the identity document',
							color: 'blue',
						});
					} catch {
						console.error('Failed to update applicant info');
					}
				}

				if (
					analysisResult.category === 'academic' &&
					(type === 'certificate' ||
						type === 'transcript' ||
						type === 'academic_record')
				) {
					if (analysisResult.examYear && analysisResult.institutionName) {
						try {
							await createAcademicRecordFromDocument(applicantId, {
								institutionName: analysisResult.institutionName,
								qualificationName: analysisResult.qualificationName,
								examYear: analysisResult.examYear,
								certificateType: analysisResult.certificateType,
								certificateNumber: analysisResult.certificateNumber,
								subjects: analysisResult.subjects,
								overallClassification: analysisResult.overallClassification,
							});
							notifications.show({
								title: 'Academic Record Created',
								message:
									'A new academic record has been created from the document',
								color: 'blue',
							});
						} catch {
							console.error('Failed to create academic record');
						}
					}
				}
			}

			notifications.show({
				title: 'Success',
				message: 'Document saved successfully',
				color: 'green',
			});

			router.refresh();
			handleClose();
		} catch (error) {
			console.error('Save error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to save document',
				color: 'red',
			});
		} finally {
			setSaving(false);
		}
	}

	function handleClose() {
		if (uploadState === 'uploading' || uploadState === 'analyzing' || saving)
			return;
		setFiles([]);
		setType(null);
		setUploadState('idle');
		setAnalysisResult(null);
		setUploadedFileName(null);
		onClose();
	}

	function getIcon() {
		const file = files[0];
		if (!file) return <IconFileUpload size={40} stroke={1.5} />;
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
			case 'analyzing':
				return 'Analyzing document with AI...';
			case 'ready':
				return analysisResult
					? `Detected: ${analysisResult.category} document`
					: 'Analysis complete';
			default:
				return '';
		}
	}

	const isProcessing =
		uploadState === 'uploading' || uploadState === 'analyzing';
	const isReady = uploadState === 'ready';

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Upload Document'
			closeOnClickOutside={!isProcessing && !saving}
			closeOnEscape={!isProcessing && !saving}
		>
			<Stack gap='lg'>
				<Select
					label='Document Type'
					placeholder={isProcessing ? 'Detecting...' : 'Select type'}
					data={TYPE_OPTIONS}
					value={type}
					onChange={handleTypeChange}
					disabled={isProcessing}
					required
				/>

				{files.length === 0 ? (
					<Paper withBorder radius='md' p='lg'>
						<Dropzone
							onDrop={handleDrop}
							onReject={handleReject}
							maxFiles={1}
							maxSize={MAX_FILE_SIZE}
							accept={ACCEPTED_MIME_TYPES}
							style={{ cursor: 'pointer' }}
							disabled={isProcessing}
							loading={isProcessing}
						>
							<Group
								justify='center'
								gap='xl'
								mih={180}
								style={{ pointerEvents: 'none' }}
							>
								<Dropzone.Accept>
									<IconUpload stroke={1.5} size={20} />
								</Dropzone.Accept>
								<Dropzone.Reject>
									<IconFile
										style={{
											width: rem(52),
											height: rem(52),
											color: 'var(--mantine-color-red-6)',
										}}
										stroke={1.5}
									/>
								</Dropzone.Reject>
								<Dropzone.Idle>
									<IconFileUpload size='5rem' />
								</Dropzone.Idle>

								<Stack gap={4} align='center'>
									<Text size='lg' inline>
										Drop file here or click to browse
									</Text>
									<Text size='xs' c='dimmed' mt={4}>
										PDF or images • Max 10 MB
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
							style={{ minHeight: rem(180) }}
							justify='center'
						>
							<ThemeIcon variant='default' size={80} radius='md'>
								{getIcon()}
							</ThemeIcon>

							<Stack gap={4} align='center'>
								<Text size='sm' fw={600} ta='center' maw={300} truncate='end'>
									{files[0].name}
								</Text>
								<Text size='sm' c='dimmed'>
									{formatFileSize(files[0].size)}
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

							{isReady && analysisResult && (
								<Text size='xs' c='blue' ta='center'>
									{getStatusMessage()}
								</Text>
							)}

							{!isProcessing && !saving && (
								<Button
									variant='light'
									color='red'
									size='sm'
									leftSection={<IconTrash size={16} />}
									onClick={handleRemoveFile}
									mt='xs'
								>
									Remove File
								</Button>
							)}
						</Stack>
					</Paper>
				)}

				<Group justify='flex-end' mt='md'>
					<Button
						variant='subtle'
						onClick={handleClose}
						disabled={isProcessing || saving}
					>
						Cancel
					</Button>
					<Button
						leftSection={<IconUpload size={16} />}
						onClick={handleSubmit}
						loading={saving}
						disabled={!type || files.length === 0 || !isReady}
					>
						{isReady ? 'Save' : 'Upload'}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
