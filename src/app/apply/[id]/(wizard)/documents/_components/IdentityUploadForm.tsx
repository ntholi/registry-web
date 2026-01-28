'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Alert, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconBan } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { DocumentCardSkeleton } from '@/shared/ui/DocumentCardShell';
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
	const [pendingUploads, setPendingUploads] = useState(0);

	const { applicant, refetch, documentLimits, isLoading } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const identityDocs =
		applicant?.documents.filter(
			(d) => d.document.type === 'identity' && d.document.fileUrl
		) ?? [];
	const hasIdentity =
		identityDocs.length > 0 &&
		(applicant?.nationalId || applicant?.dateOfBirth);

	const uploadedDocs: UploadedIdentityDoc[] = hasIdentity
		? identityDocs.map((doc) => ({
				id: doc.id,
				fileUrl: doc.document.fileUrl,
				fullName: applicant?.fullName,
				nationalId: applicant?.nationalId,
				dateOfBirth: applicant?.dateOfBirth,
				nationality: applicant?.nationality,
				documentType: doc.document.type,
			}))
		: [];

	async function handleUploadComplete(
		result: DocumentUploadResult<'identity'>
	) {
		if (!applicantId) {
			notifications.show({
				title: 'Upload failed',
				message: 'Applicant data not loaded yet. Please try again.',
				color: 'red',
			});
			return;
		}
		setUploading(true);
		setPendingUploads((prev) => prev + 1);
		const res = await uploadIdentityDocument(
			applicantId,
			result.file,
			result.analysis
		);
		if (!res.success) {
			notifications.show({
				title: 'Upload failed',
				message: res.error,
				color: 'red',
			});
		} else {
			await refetch();
			setUploadKey((prev) => prev + 1);
			notifications.show({
				title: 'Document uploaded',
				message: 'Identity document processed successfully',
				color: 'green',
			});
		}
		setUploading(false);
		setPendingUploads((prev) => Math.max(0, prev - 1));
	}

	async function handleDelete(id: string, fileUrl?: string | null) {
		if (!fileUrl) return;
		const res = await removeIdentityDocument(id, fileUrl);
		if (!res.success) {
			notifications.show({
				title: 'Delete failed',
				message: res.error,
				color: 'red',
			});
			return;
		}
		await refetch();
	}

	function handleContinue() {
		router.push(`/apply/${applicationId}/qualifications`);
	}

	const showUploadedSection = uploadedDocs.length > 0 || pendingUploads > 0;
	const uploadDisabled =
		isLoading || uploading || documentLimits.isAtLimit || pendingUploads > 0;

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Identity Documents</Title>
					<Text c='dimmed' size='sm'>
						Upload your national ID, passport, or other identity document
					</Text>
				</Stack>

				{documentLimits.isAtLimit && (
					<Alert
						color='red'
						icon={<IconBan size={16} />}
						title='Document limit reached'
					>
						You have uploaded the maximum of {documentLimits.max} documents.
						Remove some documents to upload more.
					</Alert>
				)}

				{documentLimits.isNearLimit && !documentLimits.isAtLimit && (
					<Alert
						color='yellow'
						icon={<IconAlertTriangle size={16} />}
						title='Approaching document limit'
					>
						You have uploaded {documentLimits.current} documents and are nearing
						your maximum limit. Be careful to only upload what is necessary.
					</Alert>
				)}

				{isMobile ? (
					<MobileDocumentUpload
						key={`mobile-${uploadKey}`}
						type='identity'
						onUploadComplete={handleUploadComplete}
						disabled={uploadDisabled}
						title='Upload Identity Document'
						description='National ID, passport, or birth certificate'
					/>
				) : (
					<DocumentUpload
						key={uploadKey}
						type='identity'
						onUploadComplete={handleUploadComplete}
						disabled={uploadDisabled}
						title='Upload Identity Document'
						description='National ID, passport, or birth certificate'
					/>
				)}

				{showUploadedSection && (
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
								/>
							))}
							{Array.from({ length: pendingUploads }).map((_, i) => (
								<DocumentCardSkeleton key={`skeleton-${i}`} />
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
