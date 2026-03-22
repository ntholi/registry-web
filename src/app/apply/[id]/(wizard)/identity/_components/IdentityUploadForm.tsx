'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import type { DocumentUploadResult } from '@/app/apply/_components/DocumentUpload';
import { DocumentStepForm } from '../../_components/DocumentStepForm';
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

export function IdentityUploadForm({ applicationId }: Props) {
	const { applicant } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const identityDocs =
		applicant?.documents.filter(
			(d) => d.document.type === 'identity' && d.document.fileUrl
		) ?? [];
	const hasIdentity =
		identityDocs.length > 0 &&
		(applicant?.nationalId || applicant?.dateOfBirth);
	const isIdentityLocked = hasIdentity;

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

	return (
		<DocumentStepForm
			applicationId={applicationId}
			title='Identity Documents'
			description='Upload your national ID, passport, or other identity document'
			documentType='identity'
			documents={uploadedDocs}
			onUpload={(result: DocumentUploadResult<'identity'>) =>
				uploadIdentityDocument(applicantId, result.file, result.analysis)
			}
			onDelete={(doc) =>
				removeIdentityDocument(applicantId, doc.id, doc.fileUrl ?? '')
			}
			renderCard={(doc, onDelete) => (
				<IdentityDocumentCard
					key={doc.id}
					doc={doc}
					onDelete={onDelete}
					canDelete={!isIdentityLocked}
				/>
			)}
			nextDisabled={!hasIdentity}
			nextPath={`/apply/${applicationId}/qualifications`}
			hideBack
			uploadTitle='Upload Identity Document'
			uploadDescription='National ID, passport, or birth certificate'
			successMessage='Identity document processed successfully'
			extraDisabled={Boolean(isIdentityLocked)}
		/>
	);
}
