'use client';

import {
	ActionIcon,
	AspectRatio,
	Badge,
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
	Textarea,
	ThemeIcon,
	Tooltip,
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
import { documentTypeEnum } from '@registry/_database';
import {
	IconCheck,
	IconDownload,
	IconEye,
	IconFile,
	IconFileTypePdf,
	IconFileUpload,
	IconPhoto,
	IconPlus,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { uploadDocument } from '@/core/integrations/storage';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import type { ApplicantDocument } from '../_lib/types';
import {
	deleteApplicantDocument,
	getDocumentFolder,
	saveApplicantDocument,
	verifyApplicantDocument,
} from '../_server/actions';

type DocumentType = (typeof documentTypeEnum.enumValues)[number];

type Props = {
	applicantId: string;
	documents: ApplicantDocument[];
};

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

export default function DocumentsList({ applicantId, documents }: Props) {
	const [uploadOpened, { open: openUpload, close: closeUpload }] =
		useDisclosure(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);

	const groupedDocs = documentTypeEnum.enumValues.reduce(
		(acc, type) => {
			acc[type] = documents.filter((d) => d.document.type === type);
			return acc;
		},
		{} as Record<string, ApplicantDocument[]>
	);

	const hasDocuments = documents.length > 0;

	function handlePreview(url: string) {
		setPreviewUrl(url);
		openPreview();
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Stack gap={2}>
					<Text fw={500}>Documents</Text>
					<Text size='xs' c='dimmed'>
						Identity documents, certificates, and supporting files
					</Text>
				</Stack>
				<Button
					variant='light'
					size='xs'
					leftSection={<IconPlus size={16} />}
					onClick={openUpload}
				>
					Add Document
				</Button>
			</Group>

			{!hasDocuments && (
				<Paper withBorder p='xl'>
					<Stack align='center' gap='xs'>
						<ThemeIcon size={60} variant='light' color='gray'>
							<IconFile size={30} />
						</ThemeIcon>
						<Text c='dimmed' size='sm'>
							No documents uploaded
						</Text>
					</Stack>
				</Paper>
			)}

			{documentTypeEnum.enumValues.map((type) => {
				const docs = groupedDocs[type] ?? [];
				if (docs.length === 0) return null;

				return (
					<DocumentSection
						key={type}
						title={type
							.replace(/_/g, ' ')
							.replace(/\b\w/g, (l) => l.toUpperCase())}
						documents={docs}
						onPreview={handlePreview}
					/>
				);
			})}

			<UploadModal
				opened={uploadOpened}
				onClose={closeUpload}
				applicantId={applicantId}
			/>

			<Modal
				opened={previewOpened}
				onClose={closePreview}
				title='Document Preview'
				size='xl'
				centered
			>
				{previewUrl && (
					<Box h={600}>
						{previewUrl.toLowerCase().endsWith('.pdf') ? (
							<iframe
								src={previewUrl}
								style={{ width: '100%', height: '100%', border: 'none' }}
								title='Document Preview'
							/>
						) : (
							<Box
								component='img'
								src={previewUrl}
								alt='Document Preview'
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'contain',
								}}
							/>
						)}
					</Box>
				)}
			</Modal>
		</Stack>
	);
}

type DocumentSectionProps = {
	title: string;
	documents: ApplicantDocument[];
	onPreview: (url: string) => void;
};

function DocumentSection({
	title,
	documents,
	onPreview,
}: DocumentSectionProps) {
	return (
		<Stack gap='xs'>
			<Text size='sm' fw={500} c='dimmed'>
				{title}
			</Text>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
				{documents.map((doc) => (
					<DocumentCard key={doc.id} document={doc} onPreview={onPreview} />
				))}
			</SimpleGrid>
		</Stack>
	);
}

type DocumentCardProps = {
	document: ApplicantDocument;
	onPreview: (url: string) => void;
};

function DocumentCard({ document, onPreview }: DocumentCardProps) {
	const queryClient = useQueryClient();
	const [rejectOpened, { open: openReject, close: closeReject }] =
		useDisclosure(false);
	const [rejectionReason, setRejectionReason] = useState('');

	const fileUrl = document.document.fileUrl ?? '';
	const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
	const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

	const deleteMutation = useMutation({
		mutationFn: async () => {
			await deleteApplicantDocument(document.id, fileUrl);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document deleted',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['applicants'] });
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete document',
				color: 'red',
			});
		},
	});

	const verifyMutation = useMutation({
		mutationFn: async ({
			status,
			reason,
		}: {
			status: 'verified' | 'rejected';
			reason?: string;
		}) => {
			await verifyApplicantDocument(document.id, status, reason);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document verification updated',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['applicants'] });
			closeReject();
			setRejectionReason('');
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update verification',
				color: 'red',
			});
		},
	});

	function handleDownload() {
		window.open(fileUrl, '_blank');
	}

	function submitRejection() {
		if (rejectionReason) {
			verifyMutation.mutate({ status: 'rejected', reason: rejectionReason });
		}
	}

	return (
		<>
			<Card withBorder padding='xs'>
				<AspectRatio ratio={16 / 9}>
					{isPdf ? (
						<Box
							style={{
								position: 'relative',
								overflow: 'hidden',
								cursor: 'pointer',
							}}
							onClick={() => onPreview(fileUrl)}
						>
							<iframe
								src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
								style={{
									width: '100%',
									height: '100%',
									border: 'none',
									pointerEvents: 'none',
								}}
								title={document.document.fileName}
							/>
						</Box>
					) : isImage ? (
						<Box
							style={{ cursor: 'pointer' }}
							onClick={() => onPreview(fileUrl)}
						>
							<Box
								component='img'
								src={fileUrl}
								alt={document.document.fileName}
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
								}}
							/>
						</Box>
					) : (
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
							<IconFile size={48} color='var(--mantine-color-gray-6)' />
						</Box>
					)}
				</AspectRatio>

				<Stack gap='xs' mt='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Text size='sm' fw={500} lineClamp={1} style={{ flex: 1 }}>
							{document.document.fileName}
						</Text>
						<Badge
							size='xs'
							color={getDocumentVerificationStatusColor(
								document.verificationStatus
							)}
						>
							{document.verificationStatus}
						</Badge>
					</Group>

					{document.verificationStatus === 'rejected' &&
						document.rejectionReason && (
							<Text size='xs' c='red' lineClamp={2}>
								{document.rejectionReason}
							</Text>
						)}

					<Group justify='space-between'>
						<Group gap='xs'>
							{(isPdf || isImage) && (
								<Tooltip label='Preview'>
									<ActionIcon
										variant='light'
										onClick={() => onPreview(fileUrl)}
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
							{document.verificationStatus === 'pending' && (
								<>
									<Tooltip label='Verify'>
										<ActionIcon
											variant='light'
											color='green'
											onClick={() =>
												verifyMutation.mutate({ status: 'verified' })
											}
											loading={verifyMutation.isPending}
										>
											<IconCheck size={16} />
										</ActionIcon>
									</Tooltip>
									<Tooltip label='Reject'>
										<ActionIcon
											variant='light'
											color='red'
											onClick={openReject}
										>
											<IconX size={16} />
										</ActionIcon>
									</Tooltip>
								</>
							)}
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

			<Modal
				opened={rejectOpened}
				onClose={closeReject}
				title='Reject Document'
			>
				<Stack gap='sm'>
					<Textarea
						label='Rejection Reason'
						required
						placeholder='Enter reason for rejection'
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.target.value)}
						rows={3}
					/>
					<Group justify='flex-end'>
						<Button variant='subtle' onClick={closeReject}>
							Cancel
						</Button>
						<Button
							color='red'
							onClick={submitRejection}
							loading={verifyMutation.isPending}
							disabled={!rejectionReason}
						>
							Reject
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

type UploadModalProps = {
	opened: boolean;
	onClose: () => void;
	applicantId: string;
};

function UploadModal({ opened, onClose, applicantId }: UploadModalProps) {
	const queryClient = useQueryClient();
	const [files, setFiles] = useState<FileWithPath[]>([]);
	const [type, setType] = useState<DocumentType | null>(null);
	const [loading, setLoading] = useState(false);

	function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length > 0) {
			setFiles([dropped[0]]);
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
			const folder = await getDocumentFolder(applicantId);
			const fileName = `${Date.now()}-${file.name}`;

			await uploadDocument(file, fileName, folder);

			await saveApplicantDocument({
				applicantId,
				fileName,
				type,
			});

			notifications.show({
				title: 'Success',
				message: 'Document uploaded successfully',
				color: 'green',
			});

			queryClient.invalidateQueries({ queryKey: ['applicants'] });

			setFiles([]);
			setType(null);
			onClose();
		} catch (error) {
			console.error('Upload error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to upload document',
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
		const file = files[0];
		if (!file) return <IconFileUpload size={40} stroke={1.5} />;
		if (file.type === 'application/pdf')
			return <IconFileTypePdf size={40} stroke={1.5} />;
		if (file.type.startsWith('image/'))
			return <IconPhoto size={40} stroke={1.5} />;
		return <IconFile size={40} stroke={1.5} />;
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
					placeholder='Select type'
					data={TYPE_OPTIONS}
					value={type}
					onChange={handleTypeChange}
					disabled={loading}
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
						disabled={!type || files.length === 0}
					>
						Upload
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
