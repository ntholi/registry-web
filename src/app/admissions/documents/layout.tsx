'use client';

import { Badge, Group, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import DocumentStatusFilter from './_components/DocumentStatusFilter';
import DocumentTypeFilter from './_components/DocumentTypeFilter';
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
	const statusFilter = searchParams.get('status') || 'all';
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

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		router.push(`/admissions/documents?${params.toString()}`);
	}

	function handleTypeChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('type', value);
		} else {
			params.delete('type');
		}
		params.delete('page');
		router.push(`/admissions/documents?${params.toString()}`);
	}

	return (
		<ListLayout<ReviewItem>
			path='/admissions/documents'
			queryKey={['documents-review', statusFilter, typeFilter]}
			getData={fetchDocs}
			actionIcons={[
				<DocumentStatusFilter
					key='status'
					value={statusFilter}
					onChange={handleStatusChange}
				/>,
				<DocumentTypeFilter
					key='type'
					value={typeFilter}
					onChange={handleTypeChange}
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
