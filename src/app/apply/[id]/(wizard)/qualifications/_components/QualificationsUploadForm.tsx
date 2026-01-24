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
	removeAcademicRecord,
	uploadCertificateDocument,
} from '../_server/actions';
import { AcademicRecordCard } from './AcademicRecordCard';

type Props = {
	applicationId: string;
};

export default function QualificationsUploadForm({ applicationId }: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);
	const [pendingUploads, setPendingUploads] = useState(0);

	const { applicant, refetch, documentLimits } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const records = applicant?.academicRecords ?? [];
	const hasRecords = records.length > 0;

	async function handleUploadComplete(
		result: DocumentUploadResult<'certificate'>
	) {
		try {
			setUploading(true);
			setPendingUploads((prev) => prev + 1);
			await uploadCertificateDocument(
				applicantId,
				result.file,
				result.analysis
			);
			await refetch();
			setUploadKey((prev) => prev + 1);
			notifications.show({
				title: 'Document uploaded',
				message: 'Academic document processed successfully',
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
			setPendingUploads((prev) => Math.max(0, prev - 1));
		}
	}

	async function handleDelete(id: string) {
		await removeAcademicRecord(id);
		await refetch();
	}

	function handleContinue() {
		router.push(`/apply/${applicationId}/program`);
	}

	const showUploadedSection = records.length > 0 || pendingUploads > 0;
	const uploadDisabled =
		uploading || documentLimits.isAtLimit || pendingUploads > 0;

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Academic Qualifications</Title>
					<Text c='dimmed' size='sm'>
						Upload your academic certificates, transcripts, or results slips
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
						type='certificate'
						onUploadComplete={handleUploadComplete}
						disabled={uploadDisabled}
						title='Upload Academic Document'
						description='Certificates, transcripts, results - PDF or image, max 10MB'
					/>
				) : (
					<DocumentUpload
						key={uploadKey}
						type='certificate'
						onUploadComplete={handleUploadComplete}
						disabled={uploadDisabled}
						title='Upload Academic Document'
						description='Certificates, transcripts, results - PDF or image, max 10MB'
					/>
				)}

				{showUploadedSection && (
					<Stack gap='sm'>
						<Text fw={500} size='sm'>
							Uploaded Qualifications
						</Text>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							{records.map((record) => (
								<AcademicRecordCard
									key={record.id}
									record={record}
									onDelete={() => handleDelete(record.id)}
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
					backPath='documents'
					onNext={handleContinue}
					nextDisabled={!hasRecords}
				/>
			</Stack>
		</Paper>
	);
}
