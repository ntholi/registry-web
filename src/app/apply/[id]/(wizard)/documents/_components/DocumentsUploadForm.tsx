'use client';

import { getApplicant } from '@admissions/applicants/_server/actions';
import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import {
	Button,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconCheck, IconId } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import { uploadIdentityDocument } from '../_server/actions';

type Props = {
	applicantId: string;
};

type UploadedIdentityDoc = {
	id: string;
	fullName?: string | null;
	nationalId?: string | null;
	dateOfBirth?: string | null;
	nationality?: string | null;
	documentType?: string | null;
};

export default function DocumentsUploadForm({ applicantId }: Props) {
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
		fullName: applicant?.fullName,
		nationalId: applicant?.nationalId,
		dateOfBirth: applicant?.dateOfBirth,
		nationality: applicant?.nationality,
		documentType: doc.document.type,
	}));

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
								<IdentityDocumentCard key={doc.id} doc={doc} />
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
						Continue
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}

type IdentityDocumentCardProps = {
	doc: UploadedIdentityDoc;
};

function IdentityDocumentCard({ doc }: IdentityDocumentCardProps) {
	return (
		<Card withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<Group wrap='nowrap'>
					<ThemeIcon size='lg' variant='light' color='green'>
						<IconId size={20} />
					</ThemeIcon>
					<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={600}>
							Identity Document
						</Text>
						<Group gap={4}>
							<IconCheck size={12} color='var(--mantine-color-green-6)' />
							<Text size='xs' c='green'>
								Verified
							</Text>
						</Group>
					</Stack>
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
	);
}
