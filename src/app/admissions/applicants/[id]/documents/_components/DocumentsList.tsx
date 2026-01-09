'use client';

import { documentCategoryEnum } from '@admissions/_database';
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	FileInput,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconCheck,
	IconExternalLink,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import type { ApplicantDocument } from '../_lib/types';
import {
	deleteApplicantDocument,
	uploadApplicantDocument,
	verifyApplicantDocument,
} from '../_server/actions';

type Props = {
	applicantId: string;
	documents: ApplicantDocument[];
};

const categoryOptions = documentCategoryEnum.enumValues.map((c) => ({
	value: c,
	label: c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function DocumentsList({ applicantId, documents }: Props) {
	const queryClient = useQueryClient();
	const [uploadOpened, { open: openUpload, close: closeUpload }] =
		useDisclosure(false);
	const [rejectOpened, { open: openReject, close: closeReject }] =
		useDisclosure(false);
	const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');

	const uploadForm = useForm({
		initialValues: {
			file: null as File | null,
			category: '' as string,
		},
		validate: {
			file: (value) => {
				if (!value) return 'File is required';
				if (value.size > MAX_FILE_SIZE) return 'File exceeds 5MB limit';
				return null;
			},
			category: (value) => (!value ? 'Category is required' : null),
		},
	});

	const uploadMutation = useMutation({
		mutationFn: async (values: typeof uploadForm.values) => {
			if (!values.file) throw new Error('File is required');
			return uploadApplicantDocument(
				applicantId,
				values.file,
				values.category as (typeof documentCategoryEnum.enumValues)[number]
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			uploadForm.reset();
			closeUpload();
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
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
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
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			closeReject();
			setRejectingDocId(null);
			setRejectionReason('');
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

	const groupedDocs = documentCategoryEnum.enumValues.reduce(
		(acc, category) => {
			acc[category] = documents.filter((d) => d.category === category);
			return acc;
		},
		{} as Record<string, ApplicantDocument[]>
	);

	return (
		<Stack gap='md'>
			{documentCategoryEnum.enumValues.map((category) => (
				<Stack key={category} gap='xs'>
					<Text fw={500} tt='capitalize'>
						{category.replace('_', ' ')}
					</Text>
					{groupedDocs[category]?.length > 0 ? (
						groupedDocs[category].map((doc) => (
							<Card key={doc.id} withBorder padding='sm'>
								<Group justify='space-between'>
									<Stack gap={2}>
										<Text size='sm'>{doc.fileName}</Text>
										<Group gap='xs'>
											<Badge
												size='xs'
												color={getDocumentVerificationStatusColor(
													doc.verificationStatus
												)}
											>
												{doc.verificationStatus}
											</Badge>
											{doc.uploadDate && (
												<Text size='xs' c='dimmed'>
													{new Date(doc.uploadDate).toLocaleDateString()}
												</Text>
											)}
										</Group>
										{doc.verificationStatus === 'rejected' &&
											doc.rejectionReason && (
												<Text size='xs' c='red'>
													Reason: {doc.rejectionReason}
												</Text>
											)}
									</Stack>
									<Group gap='xs'>
										<ActionIcon
											variant='subtle'
											component='a'
											href={doc.fileUrl}
											target='_blank'
										>
											<IconExternalLink size={16} />
										</ActionIcon>
										{doc.verificationStatus === 'pending' && (
											<>
												<ActionIcon
													variant='subtle'
													color='green'
													onClick={() =>
														verifyMutation.mutate({
															id: doc.id,
															status: 'verified',
														})
													}
													loading={verifyMutation.isPending}
												>
													<IconCheck size={16} />
												</ActionIcon>
												<ActionIcon
													variant='subtle'
													color='red'
													onClick={() => handleReject(doc.id)}
												>
													<IconX size={16} />
												</ActionIcon>
											</>
										)}
										<ActionIcon
											variant='subtle'
											color='red'
											onClick={() =>
												deleteMutation.mutate({
													id: doc.id,
													fileUrl: doc.fileUrl,
												})
											}
											loading={deleteMutation.isPending}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								</Group>
							</Card>
						))
					) : (
						<Text size='sm' c='dimmed'>
							No documents
						</Text>
					)}
				</Stack>
			))}

			<Button
				variant='light'
				leftSection={<IconUpload size={16} />}
				onClick={openUpload}
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
					<Stack gap='sm'>
						<FileInput
							label='File'
							required
							placeholder='Select file (max 5MB)'
							accept='image/*,application/pdf'
							{...uploadForm.getInputProps('file')}
						/>
						<Select
							label='Category'
							required
							data={categoryOptions}
							{...uploadForm.getInputProps('category')}
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
		</Stack>
	);
}
