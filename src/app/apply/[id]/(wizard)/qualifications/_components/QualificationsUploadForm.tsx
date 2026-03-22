'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Text } from '@mantine/core';
import type { DocumentUploadResult } from '@/app/apply/_components/DocumentUpload';
import { DocumentStepForm } from '../../_components/DocumentStepForm';
import {
	removeAcademicRecord,
	uploadCertificateDocument,
} from '../_server/actions';
import { AcademicRecordCard } from './AcademicRecordCard';

type Props = {
	applicationId: string;
};

export function QualificationsUploadForm({ applicationId }: Props) {
	const { applicant } = useApplicant();
	const applicantId = applicant?.id ?? '';
	const records = applicant?.academicRecords ?? [];

	return (
		<DocumentStepForm
			applicationId={applicationId}
			title='Academic Qualifications'
			description={
				<>
					Upload{' '}
					<Text c='cyan.5' component='span'>
						LGCSE
					</Text>{' '}
					equivalent or higher qualifications (multiple documents allowed).
					Documents must be certified.
				</>
			}
			documentType='certificate'
			documents={records}
			onUpload={(result: DocumentUploadResult<'certificate'>) =>
				uploadCertificateDocument(applicantId, result.file, result.analysis)
			}
			onDelete={(record) => removeAcademicRecord(record.id)}
			renderCard={(record, onDelete) => (
				<AcademicRecordCard
					key={record.id}
					record={record}
					onDelete={onDelete}
				/>
			)}
			nextDisabled={records.length === 0}
			nextPath={`/apply/${applicationId}/program`}
			backPath='identity'
			uploadTitle='Upload Academic Document'
			uploadDescription='LGCSE equivalent or higher - Image or PDF, max 2MB'
			successMessage='Academic document processed successfully'
			uploadedLabel='Uploaded Qualifications'
			applicantName={applicant?.fullName ?? undefined}
		/>
	);
}
