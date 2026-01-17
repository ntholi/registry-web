'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	FileInput,
	Group,
	Image,
	Modal,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { documentTypeEnum } from '@registry/_database';
import {
	IconCheck,
	IconExternalLink,
	IconFile,
	IconFileTypePdf,
	IconPhoto,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import type { ApplicantDocument } from '../documents/_lib/types';
import {
	deleteApplicantDocument,
	uploadApplicantDocument,
	verifyApplicantDocument,
} from '../documents/_server/actions';

type Props = {
	applicantId: string;
	documents: ApplicantDocument[];
};

const typeOptions = documentTypeEnum.enumValues.map((t) => ({
	value: t,
	label: t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isImageFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	const ext = fileName.toLowerCase().split('.').pop();
	return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

function isPdfFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	return fileName.toLowerCase().endsWith('.pdf');
}

function getDocumentIcon(fileName: string | null | undefined) {
	if (isImageFile(fileName)) return IconPhoto;
	if (isPdfFile(fileName)) return IconFileTypePdf;
	return IconFile;
}

interface DocumentCardProps {
	doc: ApplicantDocument;
	onVerify: (id: string, status: 'verified' | 'rejected') => void;
	onReject: (docId: string) => void;
	onDelete: (id: string, fileUrl: string) => void;
	isVerifying: boolean;
	isDeleting: boolean;
}

function DocumentCard({
	doc,
	onVerify,
	onReject,
	onDelete,
	isVerifying,
	isDeleting,
}: DocumentCardProps) {
	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);
	const isImage = isImageFile(doc.document.fileName);
	const Icon = getDocumentIcon(doc.document.fileName);

	return (
		<>
			<Paper p='md' radius='md' withBorder>
				<Stack gap='sm'>
					<Box
						onClick={openPreview}
						style={{ cursor: 'pointer' }}
						h={120}
						bg='gray.1'
						pos='relative'
					>
						{isImage && doc.document.fileUrl ? (
							<Image
								src={doc.document.fileUrl}
								alt={doc.document.fileName || 'Document'}
								h={120}
								fit='cover'
								radius='sm'
							/>
						) : (
							<Stack align='center' justify='center' h='100%'>
								<ThemeIcon size={48} variant='light' color='gray'>
									<Icon size={24} />
								</ThemeIcon>
							</Stack>
						)}
						<Badge
							pos='absolute'
							top={8}
							right={8}
							size='sm'
							color={getDocumentVerificationStatusColor(doc.verificationStatus)}
						>
							{doc.verificationStatus}
						</Badge>
					</Box>

					<Stack gap={4}>
						<Text size='sm' fw={500} lineClamp={1}>
							{doc.document.fileName}
						</Text>
						{doc.document.createdAt && (
							<Text size='xs' c='dimmed'>
								{formatDate(doc.document.createdAt, 'short')}
							</Text>
						)}
						{doc.verificationStatus === 'rejected' && doc.rejectionReason && (
							<Text size='xs' c='red' lineClamp={2}>
								{doc.rejectionReason}
							</Text>
						)}
					</Stack>

					<Group gap={4} justify='flex-end'>
						<ActionIcon
							variant='subtle'
							component='a'
							href={doc.document.fileUrl ?? '#'}
							target='_blank'
							title='Open in new tab'
						>
							<IconExternalLink size={16} />
						</ActionIcon>
						{doc.verificationStatus === 'pending' && (
							<>
								<ActionIcon
									variant='subtle'
									color='green'
									onClick={() => onVerify(doc.id, 'verified')}
									loading={isVerifying}
									title='Verify'
								>
									<IconCheck size={16} />
								</ActionIcon>
								<ActionIcon
									variant='subtle'
									color='red'
									onClick={() => onReject(doc.id)}
									title='Reject'
								>
									<IconX size={16} />
								</ActionIcon>
							</>
						)}
						<ActionIcon
							variant='subtle'
							color='red'
							onClick={() => onDelete(doc.id, doc.document.fileUrl ?? '')}
							loading={isDeleting}
							title='Delete'
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				</Stack>
			</Paper>

			<Modal
				opened={previewOpened}
				onClose={closePreview}
				title={doc.document.fileName}
				size='xl'
				centered
			>
				{isImage && doc.document.fileUrl ? (
					<Image
						src={doc.document.fileUrl}
						alt={doc.document.fileName || 'Document'}
						fit='contain'
						mah='70vh'
					/>
				) : (
					<Stack align='center' gap='md' py='xl'>
						<ThemeIcon size={80} variant='light' color='gray'>
							<Icon size={40} />
						</ThemeIcon>
						<Text c='dimmed'>Preview not available</Text>
						<Button
							component='a'
							href={doc.document.fileUrl ?? '#'}
							target='_blank'
							leftSection={<IconExternalLink size={16} />}
						>
							Open Document
						</Button>
					</Stack>
				)}
			</Modal>
		</>
	);
}

export default function DocumentsTab({ applicantId, documents }: Props) {
	const router = useRouter();
	const [uploadOpened, { open: openUpload, close: closeUpload }] =
		useDisclosure(false);
	const [rejectOpened, { open: openReject, close: closeReject }] =
		useDisclosure(false);
	const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');

	const uploadForm = useForm({
		initialValues: {
			file: null as File | null,
			type: '' as string,
		},
		validate: {
			file: (value) => {
				if (!value) return 'File is required';
				if (value.size > MAX_FILE_SIZE) return 'File exceeds 5MB limit';
				return null;
			},
			type: (value) => (!value ? 'Type is required' : null),
		},
	});

	const uploadMutation = useMutation({
		mutationFn: async (values: typeof uploadForm.values) => {
			if (!values.file) throw new Error('File is required');
			return uploadApplicantDocument(
				applicantId,
				values.file,
				values.type as (typeof documentTypeEnum.enumValues)[number]
			);
		},
		onSuccess: () => {
			uploadForm.reset();
			closeUpload();
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Document uploaded',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: ({ id, fileUrl }: { id: string; fileUrl: string }) =>
			deleteApplicantDocument(id, fileUrl),
		onSuccess: () => {
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Document deleted',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const verifyMutation = useMutation({
		mutationFn: ({
			id,
			status,
			reason,
		}: {
			id: string;
			status: 'verified' | 'rejected';
			reason?: string;
		}) => verifyApplicantDocument(id, status, reason),
		onSuccess: () => {
			closeReject();
			setRejectingDocId(null);
			setRejectionReason('');
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Document verification updated',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleReject(docId: string) {
		setRejectingDocId(docId);
		openReject();
	}

	function submitRejection() {
		if (rejectingDocId && rejectionReason) {
			verifyMutation.mutate({
				id: rejectingDocId,
				status: 'rejected',
				reason: rejectionReason,
			});
		}
	}

	const groupedDocs = documentTypeEnum.enumValues.reduce(
		(acc, type) => {
			const docs = documents.filter((d) => d.document.type === type);
			if (docs.length > 0) {
				acc[type] = docs;
			}
			return acc;
		},
		{} as Record<string, ApplicantDocument[]>
	);

	const hasDocuments = Object.keys(groupedDocs).length > 0;

	return (
		<Stack gap='lg'>
			{hasDocuments ? (
				Object.entries(groupedDocs).map(([type, docs]) => (
					<Stack key={type} gap='sm'>
						<Text fw={600} tt='capitalize' size='sm' c='dimmed'>
							{type.replace('_', ' ')}
						</Text>
						<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing='md'>
							{docs.map((doc) => (
								<DocumentCard
									key={doc.id}
									doc={doc}
									onVerify={(id, status) =>
										verifyMutation.mutate({ id, status })
									}
									onReject={handleReject}
									onDelete={(id, fileUrl) =>
										deleteMutation.mutate({ id, fileUrl })
									}
									isVerifying={verifyMutation.isPending}
									isDeleting={deleteMutation.isPending}
								/>
							))}
						</SimpleGrid>
					</Stack>
				))
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<ThemeIcon size={48} variant='light' color='gray'>
							<IconFile size={24} />
						</ThemeIcon>
						<Text size='sm' c='dimmed'>
							No documents uploaded
						</Text>
					</Stack>
				</Paper>
			)}

			<Button
				variant='light'
				leftSection={<IconUpload size={16} />}
				onClick={openUpload}
				w='fit-content'
			>
				Upload Document
			</Button>

			<Modal
				opened={uploadOpened}
				onClose={closeUpload}
				title='Upload Document'
			>
				<form
					onSubmit={uploadForm.onSubmit((values) =>
						uploadMutation.mutate(values)
					)}
				>
					<Stack gap='md'>
						<FileInput
							label='File'
							required
							placeholder='Select file (max 5MB)'
							accept='image/*,application/pdf'
							leftSection={<IconUpload size={16} />}
							{...uploadForm.getInputProps('file')}
						/>
						<Select
							label='Document Type'
							required
							data={typeOptions}
							{...uploadForm.getInputProps('type')}
						/>
						<Group justify='flex-end'>
							<Button variant='subtle' onClick={closeUpload}>
								Cancel
							</Button>
							<Button type='submit' loading={uploadMutation.isPending}>
								Upload
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={rejectOpened}
				onClose={closeReject}
				title='Reject Document'
			>
				<Stack gap='md'>
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
		</Stack>
	);
}
