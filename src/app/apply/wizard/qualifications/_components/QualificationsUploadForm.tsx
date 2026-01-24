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
	removeAcademicRecord,
	uploadCertificateDocument,
} from '../_server/actions';
import { AcademicRecordCard } from './AcademicRecordCard';

export default function QualificationsUploadForm() {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);

	const { applicant, refetch } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const records = applicant?.academicRecords ?? [];
	const hasRecords = records.length > 0;

	const deleteMutation = useMutation({
		mutationFn: removeAcademicRecord,
		onSuccess: () => {
			refetch();
			notifications.show({
				title: 'Record removed',
				message: 'Academic record has been deleted',
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
		result: DocumentUploadResult<'certificate'>
	) {
		try {
			setUploading(true);
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
		}
	}

	function handleDelete(id: string) {
		deleteMutation.mutate(id);
	}

	function handleContinue() {
		router.push('/apply/wizard/program');
	}

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Academic Qualifications</Title>
					<Text c='dimmed' size='sm'>
						Upload your academic certificates, transcripts, or results slips
					</Text>
				</Stack>

				{isMobile ? (
					<MobileDocumentUpload
						key={`mobile-${uploadKey}`}
						type='certificate'
						onUploadComplete={handleUploadComplete}
						disabled={uploading}
						title='Upload Academic Document'
						description='Certificates, transcripts, results - PDF or image, max 10MB'
					/>
				) : (
					<DocumentUpload
						key={uploadKey}
						type='certificate'
						onUploadComplete={handleUploadComplete}
						disabled={uploading}
						title='Upload Academic Document'
						description='Certificates, transcripts, results - PDF or image, max 10MB'
					/>
				)}

				{records.length > 0 && (
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
									deleting={deleteMutation.isPending}
								/>
							))}
						</SimpleGrid>
					</Stack>
				)}

				<WizardNavigation
					backPath='/apply/wizard/documents'
					onNext={handleContinue}
					nextDisabled={!hasRecords}
				/>
			</Stack>
		</Paper>
	);
}
