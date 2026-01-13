'use client';

import {
	ActionIcon,
	AspectRatio,
	Box,
	Button,
	Card,
	Group,
	Modal,
	Paper,
	rem,
	Select,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	MIME_TYPES,
} from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconDownload,
	IconEye,
	IconFile,
	IconFileSpreadsheet,
	IconFileTypePdf,
	IconFileUpload,
	IconPlus,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import {
	deletePublicationAttachment,
	getAttachmentFolderPath,
	getPublicationAttachments,
	savePublicationAttachment,
} from '../_server/actions';

type AttachmentType = 'scanned-pdf' | 'raw-marks' | 'other';

interface Props {
	termCode: string;
}

const ATTACHMENT_TYPE_OPTIONS = [
	{ value: 'scanned-pdf', label: 'Scanned PDF' },
	{ value: 'raw-marks', label: 'Raw Marks' },
	{ value: 'other', label: 'Other' },
];

const EXCEL_MIME_TYPES = [
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

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

function getMimeTypes(type: AttachmentType | null): string[] {
	if (type === 'scanned-pdf') return [MIME_TYPES.pdf];
	if (type === 'raw-marks') return EXCEL_MIME_TYPES;
	return [...EXCEL_MIME_TYPES, MIME_TYPES.pdf];
}

function getAcceptDescription(type: AttachmentType | null): string {
	if (type === 'scanned-pdf') return 'PDF files only';
	if (type === 'raw-marks') return 'Excel files only (.xls, .xlsx)';
	return 'PDF or Excel files';
}

export default function ResultsPublicationAttachments({ termCode }: Props) {
	const [
		uploadModalOpened,
		{ open: openUploadModal, close: closeUploadModal },
	] = useDisclosure(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);

	const { data: attachments, isLoading } = useQuery({
		queryKey: ['publication-attachments', termCode],
		queryFn: () => getPublicationAttachments(termCode),
	});

	const scannedPdf = attachments?.filter((a) => a.type === 'scanned-pdf') ?? [];
	const rawMarks = attachments?.filter((a) => a.type === 'raw-marks') ?? [];
	const other = attachments?.filter((a) => a.type === 'other') ?? [];

	function handlePreview(url: string) {
		setPreviewUrl(url);
		openPreview();
	}

	const hasAttachments =
		scannedPdf.length > 0 || rawMarks.length > 0 || other.length > 0;

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Stack gap={2}>
					<Text fw={500}>Attachments</Text>
					<Text size='xs' c='dimmed'>
						Scanned results, raw mark sheets, and other documents
					</Text>
				</Stack>
				<Button
					variant='light'
					size='xs'
					leftSection={<IconPlus size={16} />}
					onClick={openUploadModal}
				>
					Add Attachment
				</Button>
			</Group>

			{!isLoading && !hasAttachments && (
				<Paper withBorder p='xl'>
					<Stack align='center' gap='xs'>
						<ThemeIcon size={60} variant='light' color='gray'>
							<IconFile size={30} />
						</ThemeIcon>
						<Text c='dimmed' size='sm'>
							No attachments uploaded
						</Text>
					</Stack>
				</Paper>
			)}

			{scannedPdf.length > 0 && (
				<AttachmentSection
					title='Scanned Results (PDF)'
					attachments={scannedPdf}
					termCode={termCode}
					onPreview={handlePreview}
					isPdf
				/>
			)}

			{rawMarks.length > 0 && (
				<AttachmentSection
					title='Raw Mark Sheets'
					attachments={rawMarks}
					termCode={termCode}
				/>
			)}

			{other.length > 0 && (
				<AttachmentSection
					title='Other Documents'
					attachments={other}
					termCode={termCode}
					onPreview={handlePreview}
				/>
			)}

			<UploadModal
				opened={uploadModalOpened}
				onClose={closeUploadModal}
				termCode={termCode}
			/>

			<Modal
				opened={previewOpened}
				onClose={closePreview}
				title='PDF Preview'
				size='xl'
				centered
			>
				{previewUrl && (
					<Box h={600}>
						<iframe
							src={previewUrl}
							style={{ width: '100%', height: '100%', border: 'none' }}
							title='PDF Preview'
						/>
					</Box>
				)}
			</Modal>
		</Stack>
	);
}

interface AttachmentSectionProps {
	title: string;
	attachments: Array<{
		id: string;
		fileName: string;
		url: string;
		type: AttachmentType;
		createdAt: Date;
	}>;
	termCode: string;
	onPreview?: (url: string) => void;
	isPdf?: boolean;
}

function AttachmentSection({
	title,
	attachments,
	termCode,
	onPreview,
	isPdf,
}: AttachmentSectionProps) {
	return (
		<Stack gap='xs'>
			<Text size='sm' fw={500} c='dimmed'>
				{title}
			</Text>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
				{attachments.map((att) => (
					<AttachmentCard
						key={att.id}
						attachment={att}
						termCode={termCode}
						onPreview={onPreview}
						isPdf={isPdf || att.fileName.toLowerCase().endsWith('.pdf')}
					/>
				))}
			</SimpleGrid>
		</Stack>
	);
}

interface AttachmentCardProps {
	attachment: {
		id: string;
		fileName: string;
		url: string;
		type: AttachmentType;
		createdAt: Date;
	};
	termCode: string;
	onPreview?: (url: string) => void;
	isPdf?: boolean;
}

function AttachmentCard({
	attachment,
	termCode,
	onPreview,
	isPdf,
}: AttachmentCardProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const folder = getAttachmentFolderPath(termCode, attachment.type);
			await deleteDocument(`${folder}/${attachment.fileName}`);
			await deletePublicationAttachment(attachment.id);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Attachment deleted',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['publication-attachments', termCode],
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete attachment',
				color: 'red',
			});
		},
	});

	function handleDownload() {
		window.open(attachment.url, '_blank');
	}

	return (
		<Card withBorder padding='xs'>
			{isPdf ? (
				<AspectRatio ratio={16 / 9}>
					<Box
						style={{
							position: 'relative',
							overflow: 'hidden',
							cursor: 'pointer',
						}}
						onClick={() => onPreview?.(attachment.url)}
					>
						<iframe
							src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0`}
							style={{
								width: '100%',
								height: '100%',
								border: 'none',
								pointerEvents: 'none',
							}}
							title={attachment.fileName}
						/>
					</Box>
				</AspectRatio>
			) : (
				<AspectRatio ratio={16 / 9}>
					<Box
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'var(--mantine-color-dark-6)',
							cursor: 'pointer',
						}}
						onClick={handleDownload}
					>
						<IconFileSpreadsheet
							size={48}
							color='var(--mantine-color-green-6)'
						/>
					</Box>
				</AspectRatio>
			)}

			<Stack gap='xs' mt='xs'>
				<Text size='sm' fw={500} lineClamp={1}>
					{attachment.fileName}
				</Text>
				<Group justify='space-between'>
					<Group gap='xs'>
						{isPdf && onPreview && (
							<Tooltip label='Preview'>
								<ActionIcon
									variant='light'
									onClick={() => onPreview(attachment.url)}
								>
									<IconEye size={16} />
								</ActionIcon>
							</Tooltip>
						)}
						<Tooltip label='Download'>
							<ActionIcon variant='light' onClick={handleDownload}>
								<IconDownload size={16} />
							</ActionIcon>
						</Tooltip>
					</Group>
					<Tooltip label='Delete'>
						<ActionIcon
							variant='light'
							color='red'
							onClick={() => deleteMutation.mutate()}
							loading={deleteMutation.isPending}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Stack>
		</Card>
	);
}

interface UploadModalProps {
	opened: boolean;
	onClose: () => void;
	termCode: string;
}

function UploadModal({ opened, onClose, termCode }: UploadModalProps) {
	const queryClient = useQueryClient();
	const [files, setFiles] = useState<FileWithPath[]>([]);
	const [type, setType] = useState<AttachmentType | null>(null);
	const [loading, setLoading] = useState(false);
	const maxFileSize = 20 * 1024 * 1024;

	function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length > 0) {
			setFiles([dropped[0]]);
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: 'Please upload a supported file under 20 MB.',
			color: 'red',
		});
	}

	function handleRemoveFile() {
		setFiles([]);
	}

	function handleTypeChange(value: string | null) {
		setType(value as AttachmentType | null);
		setFiles([]);
	}

	async function handleSubmit() {
		if (!type) {
			notifications.show({
				title: 'Error',
				message: 'Please select an attachment type',
				color: 'red',
			});
			return;
		}

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
			const folder = await getAttachmentFolderPath(termCode, type);

			await uploadDocument(file, file.name, folder);

			await savePublicationAttachment({
				termCode,
				fileName: file.name,
				type,
			});

			notifications.show({
				title: 'Success',
				message: 'File uploaded successfully',
				color: 'green',
			});

			queryClient.invalidateQueries({
				queryKey: ['publication-attachments', termCode],
			});

			setFiles([]);
			setType(null);
			onClose();
		} catch (error) {
			console.error('Upload error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to upload file',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	function handleClose() {
		if (!loading) {
			setFiles([]);
			setType(null);
			onClose();
		}
	}

	function getIcon() {
		if (type === 'scanned-pdf')
			return <IconFileTypePdf size={40} stroke={1.5} />;
		if (type === 'raw-marks')
			return <IconFileSpreadsheet size={40} stroke={1.5} />;
		return <IconFile size={40} stroke={1.5} />;
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Upload Attachment'
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
		>
			<Stack gap='lg'>
				<Select
					label='Attachment Type'
					placeholder='Select type'
					data={ATTACHMENT_TYPE_OPTIONS}
					value={type}
					onChange={handleTypeChange}
					disabled={loading}
					required
				/>

				{type &&
					(files.length === 0 ? (
						<Paper withBorder radius='md' p='lg'>
							<Dropzone
								onDrop={handleDrop}
								onReject={handleReject}
								maxFiles={1}
								maxSize={maxFileSize}
								accept={getMimeTypes(type)}
								style={{ cursor: 'pointer' }}
								disabled={loading}
								loading={loading}
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
										<IconFileUpload size='5rem' />
									</Dropzone.Idle>

									<Stack gap={4} align='center'>
										<Text size='lg' inline>
											Drop file here or click to browse
										</Text>
										<Text size='xs' c='dimmed' mt={4}>
											{getAcceptDescription(type)} • Max 20 MB
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
					))}

				<Group justify='flex-end' mt='md'>
					<Button variant='subtle' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						leftSection={<IconUpload size={16} />}
						onClick={handleSubmit}
						loading={loading}
						disabled={!type || files.length === 0}
					>
						Upload
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
