'use client';

import { getApplicant } from '@admissions/applicants/_server/actions';
import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import {
	ActionIcon,
	Button,
	Card,
	Group,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconId, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import FinishButton from '../../../_components/FinishButton';
import {
	removeIdentityDocument,
	uploadIdentityDocument,
} from '../_server/actions';

type Props = {
	applicantId: string;
};

type UploadedIdentityDoc = {
	id: string;
	fileUrl?: string | null;
	fullName?: string | null;
	nationalId?: string | null;
	dateOfBirth?: string | null;
	nationality?: string | null;
	documentType?: string | null;
};

export default function IdentityUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);

	const { data: existingDocs } = useQuery({
		queryKey: ['applicant-documents', applicantId],
		queryFn: () => findDocumentsByApplicant(applicantId),
	});

	const { data: applicant } = useQuery({
		queryKey: ['applicant', applicantId],
		queryFn: () => getApplicant(applicantId),
	});

	const identityDocs =
		existingDocs?.items.filter((d) => d.document.type === 'identity') ?? [];
	const hasIdentity = identityDocs.length > 0;

	const uploadedDocs: UploadedIdentityDoc[] = identityDocs.map((doc) => ({
		id: doc.id,
		fileUrl: doc.document.fileUrl,
		fullName: applicant?.fullName,
		nationalId: applicant?.nationalId,
		dateOfBirth: applicant?.dateOfBirth,
		nationality: applicant?.nationality,
		documentType: doc.document.type,
	}));

	const deleteMutation = useMutation({
		mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
			return removeIdentityDocument(id, fileUrl);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['applicant-documents', applicantId],
			});
			notifications.show({
				title: 'Document removed',
				message: 'Identity document has been deleted',
				color: 'green',
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Delete failed',
				message: error instanceof Error ? error.message : 'Failed to delete',
				color: 'red',
			});
		},
	});

	async function handleUploadComplete(
		result: DocumentUploadResult<'identity'>
	) {
		try {
			setUploading(true);
			await uploadIdentityDocument(applicantId, result.file, result.analysis);
			await queryClient.invalidateQueries({
				queryKey: ['applicant-documents', applicantId],
			});
			await queryClient.invalidateQueries({
				queryKey: ['applicant', applicantId],
			});
			setUploadKey((prev) => prev + 1);
			notifications.show({
				title: 'Document uploaded',
				message: 'Identity document processed successfully',
				color: 'green',
			});
		} catch (error) {
			notifications.show({
				title: 'Upload failed',
				message: error instanceof Error ? error.message : 'Upload failed',
				color: 'red',
			});
		} finally {
			setUploading(false);
		}
	}

	function handleDelete(id: string, fileUrl?: string | null) {
		if (!fileUrl) return;
		deleteMutation.mutate({ id, fileUrl });
	}

	function handleContinue() {
		router.push(`/apply/${applicantId}/qualifications`);
	}

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Identity Documents</Title>
					<Text c='dimmed' size='sm'>
						Upload your national ID, passport, or other identity document
					</Text>
				</Stack>

				<DocumentUpload
					key={uploadKey}
					type='identity'
					onUploadComplete={handleUploadComplete}
					disabled={uploading}
					title='Upload Identity Document'
					description='National ID, passport, or birth certificate'
				/>

				{uploadedDocs.length > 0 && (
					<Stack gap='sm'>
						<Text fw={500} size='sm'>
							Uploaded Documents
						</Text>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							{uploadedDocs.map((doc) => (
								<IdentityDocumentCard
									key={doc.id}
									doc={doc}
									onDelete={() => handleDelete(doc.id, doc.fileUrl)}
									deleting={deleteMutation.isPending}
								/>
							))}
						</SimpleGrid>
					</Stack>
				)}

				<Group justify='flex-end' mt='md'>
					<Button
						rightSection={<IconArrowRight size={16} />}
						onClick={handleContinue}
						disabled={!hasIdentity}
					>
						Next
					</Button>
					<FinishButton applicantId={applicantId} />
				</Group>
			</Stack>
		</Paper>
	);
}

type IdentityDocumentCardProps = {
	doc: UploadedIdentityDoc;
	onDelete: () => void;
	deleting: boolean;
};

function IdentityDocumentCard({
	doc,
	onDelete,
	deleting,
}: IdentityDocumentCardProps) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleConfirmDelete() {
		onDelete();
		close();
	}

	return (
		<>
			<Modal opened={opened} onClose={close} title='Delete Document' centered>
				<Stack gap='md'>
					<Text size='sm'>
						Are you sure you want to delete this identity document? This action
						cannot be undone.
					</Text>
					<Group justify='flex-end'>
						<Button variant='subtle' onClick={close}>
							Cancel
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							loading={deleting}
						>
							Delete
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Card withBorder radius='md' p='md'>
				<Stack gap='sm'>
					<Group wrap='nowrap' justify='space-between'>
						<Group wrap='nowrap'>
							<ThemeIcon size='lg' variant='light' color='green'>
								<IconId size={20} />
							</ThemeIcon>
							<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
								<Text size='sm' fw={600}>
									Identity Document
								</Text>
							</Stack>
						</Group>
						<ActionIcon
							variant='subtle'
							color='red'
							onClick={open}
							disabled={deleting}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
					<Stack gap={4}>
						{doc.fullName && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Name:
								</Text>
								<Text size='xs' fw={500}>
									{doc.fullName}
								</Text>
							</Group>
						)}
						{doc.nationalId && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									ID Number:
								</Text>
								<Text size='xs' fw={500}>
									{doc.nationalId}
								</Text>
							</Group>
						)}
						{doc.dateOfBirth && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									DOB:
								</Text>
								<Text size='xs' fw={500}>
									{doc.dateOfBirth}
								</Text>
							</Group>
						)}
						{doc.nationality && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Nationality:
								</Text>
								<Text size='xs' fw={500}>
									{doc.nationality}
								</Text>
							</Group>
						)}
					</Stack>
				</Stack>
			</Card>
		</>
	);
}
