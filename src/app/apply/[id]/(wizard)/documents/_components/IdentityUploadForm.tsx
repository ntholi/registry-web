'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import { MobileDocumentUpload } from '@/shared/ui/MobileDocumentUpload';
import WizardNavigation from '../../_components/WizardNavigation';
import {
	removeIdentityDocument,
	uploadIdentityDocument,
} from '../_server/actions';
import {
	IdentityDocumentCard,
	type UploadedIdentityDoc,
} from './IdentityDocumentCard';

type Props = {
	applicationId: string;
};

export default function IdentityUploadForm({ applicationId }: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);

	const { applicant, refetch } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const identityDocs =
		applicant?.documents.filter((d) => d.document.type === 'identity') ?? [];
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
			refetch();
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
			await refetch();
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
		router.push(`/apply/${applicationId}/qualifications`);
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

				{isMobile ? (
					<MobileDocumentUpload
						key={`mobile-${uploadKey}`}
						type='identity'
						onUploadComplete={handleUploadComplete}
						disabled={uploading}
						title='Upload Identity Document'
						description='National ID, passport, or birth certificate'
					/>
				) : (
					<DocumentUpload
						key={uploadKey}
						type='identity'
						onUploadComplete={handleUploadComplete}
						disabled={uploading}
						title='Upload Identity Document'
						description='National ID, passport, or birth certificate'
					/>
				)}

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

				<WizardNavigation
					applicationId={applicationId}
					onNext={handleContinue}
					nextDisabled={!hasIdentity}
					hideBack
				/>
			</Stack>
		</Paper>
	);
}
