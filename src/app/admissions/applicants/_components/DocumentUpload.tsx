'use client';

import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import {
	Button,
	Group,
	Paper,
	Progress,
	Stack,
	Text,
	ThemeIcon,
	rem,
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
	IconFileTypePdf,
	IconFileUpload,
	IconPhoto,
	IconPlus,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { analyzeDocumentWithAI } from '../[id]/documents/_server/actions';
import {
	type PendingDocument,
	createApplicantFromDocuments,
} from '../_server/document-actions';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'ready';

type FileItem = {
	id: string;
	file: FileWithPath;
	uploadState: UploadState;
	analysisResult: DocumentAnalysisResult | null;
	uploadedFileName: string | null;
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const exp = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const val = bytes / 1024 ** exp;
	return `${val.toFixed(val < 10 && exp > 0 ? 1 : 0)} ${units[exp]}`;
}

function getFileExtension(name: string) {
	const index = name.lastIndexOf('.');
	if (index === -1 || index === name.length - 1) return '';
	return name.slice(index);
}

export default function DocumentUpload() {
	const router = useRouter();
	const [fileItems, setFileItems] = useState<FileItem[]>([]);
	const [saving, setSaving] = useState(false);

	function updateFileItem(id: string, updates: Partial<FileItem>) {
		setFileItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
		);
	}

	async function processFile(fileItem: FileItem) {
		const { id, file } = fileItem;

		updateFileItem(id, { uploadState: 'uploading' });

		try {
			const folder = 'documents/admissions';
			const fileName = `${nanoid()}.${getFileExtension(file.name)}`;
			await uploadDocument(file, fileName, folder);

			updateFileItem(id, {
				uploadState: 'analyzing',
				uploadedFileName: fileName,
			});

			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const charArray = Array.from(uint8Array, (byte) =>
				String.fromCharCode(byte),
			);
			const binaryString = charArray.join('');
			const base64Data = btoa(binaryString);

			const result = await analyzeDocumentWithAI(base64Data, file.type);
			if (!result.success) {
				throw new Error(result.error);
			}

			updateFileItem(id, {
				uploadState: 'ready',
				analysisResult: result.data,
			});
		} catch (error) {
			console.error('Upload/Analysis error:', error);
			notifications.show({
				title: 'Error',
				message: `Failed to process ${file.name}`,
				color: 'red',
			});
			setFileItems((prev) => prev.filter((item) => item.id !== id));
		}
	}

	async function handleDrop(dropped: FileWithPath[]) {
		const newItems: FileItem[] = dropped.map((file) => ({
			id: nanoid(),
			file,
			uploadState: 'idle' as UploadState,
			analysisResult: null,
			uploadedFileName: null,
		}));

		setFileItems((prev) => [...prev, ...newItems]);

		for (const item of newItems) {
			await processFile(item);
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'Files not accepted',
			message: 'Please upload supported files under 10 MB.',
			color: 'red',
		});
	}

	function handleRemoveFile(id: string) {
		setFileItems((prev) => prev.filter((item) => item.id !== id));
	}

	async function handleSubmit() {
		const readyFiles = fileItems.filter(
			(f) => f.uploadState === 'ready' && f.analysisResult,
		);

		if (readyFiles.length === 0) {
			notifications.show({
				title: 'Error',
				message: 'Please upload at least one document',
				color: 'red',
			});
			return;
		}

		const hasIdentity = readyFiles.some(
			(f) => f.analysisResult?.category === 'identity',
		);

		if (!hasIdentity) {
			notifications.show({
				title: 'Identity Required',
				message: 'Please upload an identity document (ID or Passport)',
				color: 'orange',
			});
			return;
		}

		try {
			setSaving(true);

			const documents: PendingDocument[] = readyFiles.map((f) => ({
				fileName: f.uploadedFileName!,
				originalName: f.file.name,
				analysisResult: f.analysisResult!,
			}));

			const applicant = await createApplicantFromDocuments(documents);

			notifications.show({
				title: 'Success',
				message: 'Applicant created from uploaded documents',
				color: 'green',
			});

			router.push(`/admissions/applicants/${applicant.id}`);
		} catch (error) {
			console.error('Save error:', error);
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to create applicant',
				color: 'red',
			});
		} finally {
			setSaving(false);
		}
	}

	function getIcon(file: FileWithPath) {
		if (file.type === 'application/pdf')
			return <IconFileTypePdf size={24} stroke={1.5} />;
		if (file.type.startsWith('image/'))
			return <IconPhoto size={24} stroke={1.5} />;
		return <IconFileUpload size={24} stroke={1.5} />;
	}

	function getStatusText(item: FileItem): string {
		switch (item.uploadState) {
			case 'uploading':
				return 'Uploading...';
			case 'analyzing':
				return 'Analyzing...';
			case 'ready':
				return item.analysisResult
					? `${item.analysisResult.category
							.charAt(0)
							.toUpperCase()}${item.analysisResult.category.slice(1)} document`
					: 'Ready';
			default:
				return '';
		}
	}

	const isProcessing = fileItems.some(
		(f) => f.uploadState === 'uploading' || f.uploadState === 'analyzing',
	);
	const readyCount = fileItems.filter((f) => f.uploadState === 'ready').length;
	const hasIdentity = fileItems.some(
		(f) =>
			f.uploadState === 'ready' && f.analysisResult?.category === 'identity',
	);

	return (
		<Stack gap='lg'>
			<Text size='sm' c='dimmed'>
				Upload documents to automatically create an applicant profile. We
				recommend uploading an identity document (ID/Passport) and academic
				certificates.
			</Text>

			<Paper withBorder radius='md' p='lg'>
				<Dropzone
					onDrop={handleDrop}
					onReject={handleReject}
					maxSize={MAX_FILE_SIZE}
					accept={ACCEPTED_MIME_TYPES}
					style={{ cursor: 'pointer' }}
					disabled={isProcessing || saving}
				>
					<Group
						justify='center'
						gap='xl'
						mih={120}
						style={{ pointerEvents: 'none' }}
					>
						<Dropzone.Accept>
							<IconUpload stroke={1.5} size={40} />
						</Dropzone.Accept>
						<Dropzone.Reject>
							<IconFileUpload
								style={{
									width: rem(40),
									height: rem(40),
									color: 'var(--mantine-color-red-6)',
								}}
								stroke={1.5}
							/>
						</Dropzone.Reject>
						<Dropzone.Idle>
							<IconFileUpload size={40} stroke={1.5} />
						</Dropzone.Idle>

						<Stack gap={4} align='center'>
							<Text size='md' inline>
								Drop documents here or click to browse
							</Text>
							<Text size='xs' c='dimmed' mt={4}>
								PDF or images • Max 10 MB per file
							</Text>
						</Stack>
					</Group>
				</Dropzone>
			</Paper>

			{fileItems.length > 0 && (
				<Stack gap='sm'>
					<Text size='sm' fw={500}>
						Uploaded Documents ({readyCount}/{fileItems.length} ready)
					</Text>

					{fileItems.map((item) => (
						<Paper key={item.id} withBorder radius='md' p='md'>
							<Group justify='space-between' wrap='nowrap'>
								<Group gap='md' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
									<ThemeIcon variant='light' size='lg' radius='md'>
										{getIcon(item.file)}
									</ThemeIcon>

									<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
										<Text size='sm' fw={500} truncate='end'>
											{item.file.name}
										</Text>
										<Group gap='xs'>
											<Text size='xs' c='dimmed'>
												{formatFileSize(item.file.size)}
											</Text>
											<Text
												size='xs'
												c={item.uploadState === 'ready' ? 'blue' : 'dimmed'}
											>
												• {getStatusText(item)}
											</Text>
										</Group>
									</Stack>
								</Group>

								{item.uploadState === 'uploading' ||
								item.uploadState === 'analyzing' ? (
									<Progress radius='xs' value={100} animated w={80} size='sm' />
								) : (
									<Button
										variant='subtle'
										color='red'
										size='xs'
										onClick={() => handleRemoveFile(item.id)}
										disabled={saving}
									>
										<IconTrash size={16} />
									</Button>
								)}
							</Group>
						</Paper>
					))}
				</Stack>
			)}

			<Group justify='flex-end' mt='md'>
				<Button
					leftSection={<IconPlus size={16} />}
					onClick={handleSubmit}
					loading={saving}
					disabled={
						fileItems.length === 0 || isProcessing || !hasIdentity || saving
					}
				>
					Create Applicant
				</Button>
			</Group>
		</Stack>
	);
}
