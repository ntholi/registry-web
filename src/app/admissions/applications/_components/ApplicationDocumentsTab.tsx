'use client';

import DocumentsTab from '@admissions/applicants/[id]/_components/DocumentsTab';
import type { ApplicantDocument } from '@admissions/applicants/[id]/documents/_lib/types';
import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import { useQuery } from '@tanstack/react-query';

type Props = {
	applicantId: string;
	documents: ApplicantDocument[];
	isActive: boolean;
};

export default function ApplicationDocumentsTab({
	applicantId,
	documents: initial,
	isActive,
}: Props) {
	const { data } = useQuery({
		queryKey: ['applicant-documents', applicantId],
		queryFn: async () => {
			const result = await findDocumentsByApplicant(applicantId);
			return result.items;
		},
		initialData: initial,
		enabled: isActive,
	});

	return <DocumentsTab documents={data} />;
}
