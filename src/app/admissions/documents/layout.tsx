'use client';

import { Badge, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import DocumentReviewFilter from './_components/DocumentReviewFilter';
import { getDocumentsForReview } from './_server/actions';

type ReviewItem = {
	id: string;
	verificationStatus: DocumentVerificationStatus | null;
	applicantName: string;
	documentType: DocumentType | null;
	fileName: string;
	fileUrl: string | null;
	createdAt: Date | null;
};

export default function DocumentsLayout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const statusFilter = searchParams.get('status') || 'pending';
	const typeFilter = searchParams.get('type') || 'all';

	async function fetchDocs(page: number, search: string) {
		const filters: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		} = {};
		if (statusFilter !== 'all')
			filters.status = statusFilter as DocumentVerificationStatus;
		if (typeFilter !== 'all') filters.type = typeFilter as DocumentType;
		return getDocumentsForReview(page, search, filters);
	}

	return (
		<ListLayout<ReviewItem>
			path='/admissions/documents'
			queryKey={['documents-review', searchParams.toString()]}
			getData={fetchDocs}
			actionIcons={[<DocumentReviewFilter key='documents-filter' />]}
			renderItem={(doc) => (
				<ListItem
					id={doc.id}
					label={doc.applicantName}
					description={
						<Badge
							size='xs'
							variant='light'
							color={getDocumentTypeColor(doc.documentType)}
						>
							{doc.documentType?.replace('_', ' ') ?? 'Unknown'}
						</Badge>
					}
					rightSection={
						<ThemeIcon
							variant='transparent'
							c={getStatusColor(doc.verificationStatus || 'pending')}
						>
							{getStatusIcon(doc.verificationStatus || 'pending')}
						</ThemeIcon>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function getStatusIcon(status: 'pending' | 'verified' | 'rejected') {
	switch (status) {
		case 'pending':
			return <IconClock size={'1rem'} />;
		case 'verified':
			return <IconCheck size={'1rem'} />;
		case 'rejected':
			return <IconAlertCircle size={'1rem'} />;
	}
}

function getDocumentTypeColor(type: DocumentType | null) {
	switch (type) {
		case 'identity':
			return 'blue';
		case 'academic_record':
		case 'certificate':
			return 'green';
		case 'proof_of_payment':
			return 'cyan';
		case 'passport_photo':
			return 'violet';
		case 'recommendation_letter':
			return 'orange';
		case 'personal_statement':
			return 'indigo';
		case 'medical_report':
			return 'red';
		case 'enrollment_letter':
			return 'lime';
		case 'clearance_form':
			return 'yellow';
		default:
			return 'gray';
	}
}
