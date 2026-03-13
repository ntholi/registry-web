'use client';

import {
	Button,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { getStudentDocuments } from '@registry/documents';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import { authClient } from '@/core/auth-client';
import AddDocumentModal from './AddDocumentModal';
import DeleteDocumentModal from './DeleteDocumentModal';
import DocumentCard from './DocumentCard';

type DocumentsViewProps = {
	stdNo: number;
	isActive: boolean;
};

export default function DocumentsView({ stdNo, isActive }: DocumentsViewProps) {
	const { data: session } = authClient.useSession();
	const [addModalOpened, setAddModalOpened] = useState(false);
	const [deleteModalOpened, setDeleteModalOpened] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		id: string;
		fileName: string;
		fileUrl: string | null;
	} | null>(null);

	const {
		data: documents,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['student-documents', stdNo],
		queryFn: () => getStudentDocuments(stdNo),
		enabled: isActive,
	});

	const canEdit = hasSessionPermission(session, 'documents', 'create', [
		'admin',
	]);

	const canView = hasSessionPermission(session, 'documents', 'read', ['admin']);

	if (!canView) {
		return (
			<Paper p='xl' withBorder>
				<Text c='dimmed'>You do not have permission to view documents.</Text>
			</Paper>
		);
	}

	function handleDelete(id: string, fileName: string, fileUrl: string | null) {
		setSelectedDocument({ id, fileName, fileUrl });
		setDeleteModalOpened(true);
	}

	return (
		<Stack gap='md'>
			{canEdit && (
				<Card withBorder p='md'>
					<Group justify='space-between' align='center'>
						<Stack gap={4}>
							<Text size='sm' fw={500}>
								Student Documents
							</Text>
							<Text size='xs' c='dimmed'>
								Upload student documents such as internal documents,
								certificates, or ID copies
							</Text>
						</Stack>
						<Button
							leftSection={<IconPlus size={14} />}
							variant='filled'
							size='sm'
							color='blue'
							onClick={() => setAddModalOpened(true)}
						>
							Upload
						</Button>
					</Group>
				</Card>
			)}

			{isLoading ? (
				<Text c='dimmed'>Loading documents...</Text>
			) : !documents || documents.length === 0 ? (
				<Paper p='xl' withBorder>
					<Text c='dimmed' ta='center'>
						No documents found for this student.
					</Text>
				</Paper>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
					{documents.map((doc) => (
						<DocumentCard
							key={doc.id}
							id={doc.id}
							fileName={doc.document.fileName}
							fileUrl={doc.document.fileUrl}
							type={doc.document.type}
							createdAt={doc.document.createdAt}
							canEdit={canEdit}
							onDelete={handleDelete}
						/>
					))}
				</SimpleGrid>
			)}

			<AddDocumentModal
				opened={addModalOpened}
				onClose={() => setAddModalOpened(false)}
				stdNo={stdNo}
				onSuccess={() => {
					refetch();
					setAddModalOpened(false);
				}}
			/>

			{selectedDocument && (
				<DeleteDocumentModal
					opened={deleteModalOpened}
					onClose={() => {
						setDeleteModalOpened(false);
						setSelectedDocument(null);
					}}
					document={selectedDocument}
					onSuccess={() => {
						refetch();
						setDeleteModalOpened(false);
						setSelectedDocument(null);
					}}
				/>
			)}
		</Stack>
	);
}
