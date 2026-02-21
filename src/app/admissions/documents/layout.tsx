'use client';

import { Badge, Group, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
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
	const router = useRouter();
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

	function handleFilterApply(filters: { status: string; type: string }) {
		const params = new URLSearchParams(searchParams);

		if (filters.status !== 'pending') {
			params.set('status', filters.status);
		} else {
			params.delete('status');
		}

		if (filters.type !== 'all') {
			params.set('type', filters.type);
		} else {
			params.delete('type');
		}

		params.delete('page');
		const query = params.toString();
		router.push(
			query ? `/admissions/documents?${query}` : '/admissions/documents'
		);
	}

	return (
		<ListLayout<ReviewItem>
			path='/admissions/documents'
			queryKey={['documents-review', statusFilter, typeFilter]}
			getData={fetchDocs}
			actionIcons={[
				<DocumentReviewFilter
					key='documents-filter'
					statusValue={statusFilter}
					typeValue={typeFilter}
					onApply={handleFilterApply}
				/>,
			]}
			renderItem={(doc) => (
				<ListItem
					id={doc.id}
					label={
						<Group gap='xs'>
							<Text size='sm' truncate>
								{doc.applicantName}
							</Text>
							{doc.verificationStatus && (
								<Badge
									size='xs'
									variant='light'
									color={getDocumentVerificationStatusColor(
										doc.verificationStatus
									)}
								>
									{doc.verificationStatus}
								</Badge>
							)}
						</Group>
					}
					description={
						<Text size='xs' c='dimmed' truncate>
							{doc.documentType?.replace('_', ' ') ?? 'Unknown'} •{' '}
							{doc.fileName}
						</Text>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
